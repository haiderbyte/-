import React from 'react';
import { BookOpen, Sparkles, MessageSquareQuote, Sliders, Palette } from 'lucide-react';
import { audioManager } from '../utils/sound';

export type TabId = 'home' | 'library' | 'chat' | 'studio' | 'settings';

interface BottomNavigationProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  theme: 'dark' | 'sepia';
  favoritesCount: number;
  isHidden?: boolean;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onSelectTab,
  theme,
  favoritesCount,
  isHidden = false,
}) => {
  const tabs = [
    {
      id: 'home' as TabId,
      label: 'الرئيسية',
      kanji: 'ホーム',
      icon: Sparkles,
    },
    {
      id: 'library' as TabId,
      label: 'الشذرات',
      kanji: '断片集',
      icon: BookOpen,
    },
    {
      id: 'chat' as TabId,
      label: 'روح دازاي',
      kanji: '対話',
      icon: MessageSquareQuote,
    },
    {
      id: 'studio' as TabId,
      label: 'البطاقات',
      kanji: 'カード',
      icon: Palette,
    },
    {
      id: 'settings' as TabId,
      label: 'الإعدادات',
      kanji: '設定',
      icon: Sliders,
      badge: favoritesCount > 0 ? favoritesCount : undefined,
    },
  ];

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-lg transition-all duration-300 pb-safe ${
        isHidden
          ? 'translate-y-full opacity-0 pointer-events-none'
          : 'translate-y-0 opacity-100'
      } ${
        theme === 'dark'
          ? 'bg-[#151518]/95 border-[#26262B] text-[#E2D9C8]'
          : 'bg-[#F6EFE3]/95 border-[#E2D5C0] text-[#2C241D]'
      }`}
    >
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                audioManager.playPaperRustle();
                onSelectTab(tab.id);
              }}
              className={`flex-1 py-1.5 flex flex-col items-center justify-center relative transition-all duration-200 group ${
                isActive
                  ? theme === 'dark'
                    ? 'text-[#FAF6EE]'
                    : 'text-[#7A3838]'
                  : theme === 'dark'
                  ? 'text-[#8A857D] hover:text-[#C5BAA8]'
                  : 'text-[#8B7C6E] hover:text-[#4A3D31]'
              }`}
            >
              {/* Active Indicator Top Notch */}
              {isActive && (
                <span
                  className={`absolute top-0 w-8 h-[2px] rounded-full transition-all ${
                    theme === 'dark' ? 'bg-[#C46868]' : 'bg-[#7A3838]'
                  }`}
                />
              )}

              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110' : 'group-hover:scale-105'
                  }`}
                />
                {tab.badge !== undefined && (
                  <span
                    className={`absolute -top-1 -right-2 text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-sans font-medium text-white ${
                      theme === 'dark' ? 'bg-[#8B3A3A]' : 'bg-[#7A3838]'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className="text-[11px] font-amiri mt-0.5 tracking-tight font-medium">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
