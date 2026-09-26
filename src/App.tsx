/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Quote, CategoryId, AIProviderConfig } from './types';
import { getAllQuotes, getDailyQuote, getFavorites, toggleFavorite, saveCustomQuote, getAIConfig, saveAIConfig, getTheme, saveTheme } from './utils/storage';
import {
  fetchOrGenerateDailyQuote,
  getDailyQuotesHistory,
  isAutoDailyQuoteEnabled,
  getTodayDateKey,
  getStoredDailyRecord,
} from './utils/dailyQuoteManager';
import { audioManager } from './utils/sound';
import { Navbar } from './components/Navbar';
import { BottomNavigation, TabId } from './components/BottomNavigation';
import { HomeView } from './components/HomeView';
import { QuotesLibraryView } from './components/QuotesLibraryView';
import { AIChatView } from './components/AIChatView';
import { CardStudioModal } from './components/CardStudioModal';
import { InteractiveCardStudio } from './components/InteractiveCardStudio';
import { AIProviderSettings } from './components/AIProviderSettings';
import { AIGenerateQuoteModal } from './components/AIGenerateQuoteModal';
import { DailyQuotesArchiveModal } from './components/DailyQuotesArchiveModal';
import { DailyNotificationModal } from './components/DailyNotificationModal';
import { AtmosphereCanvas, AtmosphereMode, AtmosphereDensity } from './components/AtmosphereCanvas';
import { notificationManager } from './utils/notificationManager';
import { getNotificationSettings } from './utils/storage';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'sepia'>(() => getTheme());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isMobileFrame, setIsMobileFrame] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [libraryInitialCategory, setLibraryInitialCategory] = useState<CategoryId | 'all' | 'favorites' | 'daily'>('all');

  // Background Atmosphere effect (Leaves / Dust)
  const [atmosphereMode, setAtmosphereMode] = useState<AtmosphereMode>(() => {
    return (localStorage.getItem('dazai_atmosphere_mode') as AtmosphereMode) || 'both';
  });
  const [atmosphereDensity, setAtmosphereDensity] = useState<AtmosphereDensity>(() => {
    return (localStorage.getItem('dazai_atmosphere_density') as AtmosphereDensity) || 'normal';
  });

  const handleSetAtmosphereMode = (mode: AtmosphereMode) => {
    setAtmosphereMode(mode);
    localStorage.setItem('dazai_atmosphere_mode', mode);
  };

  const handleSetAtmosphereDensity = (density: AtmosphereDensity) => {
    setAtmosphereDensity(density);
    localStorage.setItem('dazai_atmosphere_density', density);
  };

  const [allQuotes, setAllQuotes] = useState<Quote[]>(() => getAllQuotes());
  const [favorites, setFavorites] = useState<string[]>(() => getFavorites());
  const [dailyQuote, setDailyQuote] = useState<Quote>(() => {
    const stored = getStoredDailyRecord();
    return stored?.quote || getDailyQuote();
  });
  const [aiConfig, setAiConfig] = useState<AIProviderConfig>(() => getAIConfig());

  // Daily AI state
  const [isDailyArchiveOpen, setIsDailyArchiveOpen] = useState(false);
  const [isRefreshingDaily, setIsRefreshingDaily] = useState(false);
  const [dailyHistoryCount, setDailyHistoryCount] = useState<number>(() => getDailyQuotesHistory().length);

  // Modals state
  const [studioQuote, setStudioQuote] = useState<Quote | null>(null);
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState(() => getNotificationSettings());

  // Automatically ensure notifications are scheduled if enabled
  useEffect(() => {
    const settings = getNotificationSettings();
    setNotificationSettings(settings);
    if (settings.enabled) {
      notificationManager.scheduleDailyNotification(dailyQuote);
    }
  }, [dailyQuote]);

  // Sync theme to root class
  useEffect(() => {
    saveTheme(theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.className =
        'bg-[#141416] text-[#E2D9C8] antialiased selection:bg-[#8B3A3A] selection:text-[#FAF6EE] min-h-screen';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.className =
        'bg-[#F5EDE0] text-[#2C241D] antialiased selection:bg-[#7A3838] selection:text-[#FAF6EE] min-h-screen';
    }
  }, [theme]);

  // Automatic Daily Quote Generation on launch & date changes
  const checkAndRunDailyGeneration = useCallback(async (force = false) => {
    if (!isAutoDailyQuoteEnabled() && !force) return;

    try {
      const { record, isNew } = await fetchOrGenerateDailyQuote(aiConfig, force);
      if (record && record.quote) {
        setDailyQuote(record.quote);
        setAllQuotes(getAllQuotes());
        setDailyHistoryCount(getDailyQuotesHistory().length);
      }
    } catch (err) {
      console.warn('Auto daily quote check encountered an issue:', err);
    }
  }, [aiConfig]);

  useEffect(() => {
    checkAndRunDailyGeneration(false);
  }, [checkAndRunDailyGeneration]);

  // When tab becomes active or midnight passes, verify date and generate if new day
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const todayKey = getTodayDateKey();
        const stored = getStoredDailyRecord();
        if (!stored || stored.dateKey !== todayKey) {
          checkAndRunDailyGeneration(false);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [checkAndRunDailyGeneration]);

  // Audio manager toggle
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audioManager.enabled = next;
  };

  const handleToggleFavorite = (quoteId: string) => {
    const updated = toggleFavorite(quoteId);
    setFavorites(updated);
  };

  const handleSelectCategoryFromHome = (catId: CategoryId) => {
    setLibraryInitialCategory(catId);
    setActiveTab('library');
  };

  const handleQuoteGenerated = (newQuote: Quote) => {
    const updated = saveCustomQuote(newQuote);
    setAllQuotes(updated);
    setStudioQuote(newQuote);
  };

  // Regenerate today's daily quote on demand
  const handleRegenerateDaily = async () => {
    setIsRefreshingDaily(true);
    try {
      await checkAndRunDailyGeneration(true);
      audioManager.playSingingBowl();
    } finally {
      setIsRefreshingDaily(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans-ui transition-colors duration-300 relative ${
        theme === 'dark' ? 'bg-[#141416] text-[#E2D9C8]' : 'bg-[#F5EDE0] text-[#2C241D]'
      }`}
    >
      {/* Melancholic Atmosphere Canvas (Falling Autumn Leaves & Dust Motes) */}
      <AtmosphereCanvas
        mode={atmosphereMode}
        density={atmosphereDensity}
        theme={theme}
      />

      {/* Container wrapper: either full responsive or mobile frame mode */}
      <div
        className={
          isMobileFrame
            ? 'max-w-md mx-auto my-0 sm:my-6 min-h-screen sm:min-h-[860px] sm:max-h-[92vh] sm:rounded-[36px] sm:border-[8px] sm:border-[#2C2C35] sm:shadow-2xl flex flex-col overflow-hidden relative z-10'
            : 'flex-1 flex flex-col w-full relative z-10'
        }
      >
        {/* Top Navbar */}
        <Navbar
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'sepia' : 'dark')}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          isMobileFrame={isMobileFrame}
          onToggleMobileFrame={() => setIsMobileFrame(!isMobileFrame)}
          atmosphereMode={atmosphereMode}
          onSetAtmosphereMode={handleSetAtmosphereMode}
          atmosphereDensity={atmosphereDensity}
          onSetAtmosphereDensity={handleSetAtmosphereDensity}
          onOpenNotificationModal={() => {
            setNotificationSettings(getNotificationSettings());
            setIsNotificationModalOpen(true);
          }}
          isNotificationEnabled={notificationSettings.enabled}
        />

        {/* Main Content Area */}
        <main className={`flex-1 w-full mx-auto px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 pb-20 sm:pb-24 ${
          activeTab === 'chat' ? 'max-w-5xl' : 'max-w-4xl'
        }`}>
          {activeTab === 'home' && (
            <HomeView
              dailyQuote={dailyQuote}
              allQuotes={allQuotes}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              onOpenCardStudio={(q) => setStudioQuote(q)}
              onSelectCategory={handleSelectCategoryFromHome}
              onGoToChat={() => setActiveTab('chat')}
              onOpenAIGenerator={() => setIsAIGeneratorOpen(true)}
              theme={theme}
              onRegenerateDaily={handleRegenerateDaily}
              isRefreshingDaily={isRefreshingDaily}
              onOpenDailyArchive={() => setIsDailyArchiveOpen(true)}
              historyCount={dailyHistoryCount}
              onOpenNotificationModal={() => {
                setNotificationSettings(getNotificationSettings());
                setIsNotificationModalOpen(true);
              }}
            />
          )}

          {activeTab === 'library' && (
            <QuotesLibraryView
              quotes={allQuotes}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              onOpenCardStudio={(q) => setStudioQuote(q)}
              onOpenAIGenerator={() => setIsAIGeneratorOpen(true)}
              theme={theme}
              initialCategory={libraryInitialCategory}
            />
          )}

          {activeTab === 'chat' && (
            <AIChatView
              aiConfig={aiConfig}
              theme={theme}
              onOpenSettings={() => setActiveTab('settings')}
            />
          )}

          {activeTab === 'studio' && (
            <InteractiveCardStudio
              initialQuote={dailyQuote}
              allQuotes={allQuotes}
              theme={theme}
            />
          )}

          {activeTab === 'settings' && (
            <AIProviderSettings
              config={aiConfig}
              onChangeConfig={(c) => setAiConfig(c)}
              theme={theme}
              favoritesCount={favorites.length}
              onViewFavorites={() => {
                setLibraryInitialCategory('favorites');
                setActiveTab('library');
              }}
              onOpenDailyArchive={() => setIsDailyArchiveOpen(true)}
            />
          )}
        </main>

        {/* Bottom Mobile Navigation */}
        <BottomNavigation
          activeTab={activeTab}
          onSelectTab={(tab) => {
            if (tab === 'library') {
              setLibraryInitialCategory('all');
            }
            setActiveTab(tab);
          }}
          theme={theme}
          favoritesCount={favorites.length}
        />

        {/* Modal: Card Studio Exporter */}
        {studioQuote && (
          <CardStudioModal
            quote={studioQuote}
            allQuotes={allQuotes}
            onClose={() => setStudioQuote(null)}
            theme={theme}
          />
        )}

        {/* Modal: AI Quote Generator */}
        {isAIGeneratorOpen && (
          <AIGenerateQuoteModal
            onClose={() => setIsAIGeneratorOpen(false)}
            onQuoteGenerated={handleQuoteGenerated}
            aiConfig={aiConfig}
            theme={theme}
          />
        )}

        {/* Modal: Daily Quotes History Archive */}
        {isDailyArchiveOpen && (
          <DailyQuotesArchiveModal
            onClose={() => setIsDailyArchiveOpen(false)}
            onOpenCardStudio={(q) => setStudioQuote(q)}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            theme={theme}
          />
        )}

        {/* Modal: Daily Local Notifications Scheduler */}
        {isNotificationModalOpen && (
          <DailyNotificationModal
            onClose={() => {
              setNotificationSettings(getNotificationSettings());
              setIsNotificationModalOpen(false);
            }}
            dailyQuote={dailyQuote}
            theme={theme}
          />
        )}
      </div>
    </div>
  );
}
