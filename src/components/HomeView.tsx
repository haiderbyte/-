import React from 'react';
import { Quote, CategoryId } from '../types';
import { CATEGORIES, PERSONAS } from '../data/quotesData';
import { DailyReflectionCard } from './DailyReflectionCard';
import { RandomQuoteGenerator } from './RandomQuoteGenerator';
import {
  Sparkles,
  BookOpen,
  MessageSquareQuote,
  Moon,
  Compass,
  HeartHandshake,
  Sunset,
  Feather,
  ArrowLeft,
} from 'lucide-react';
import { audioManager } from '../utils/sound';

interface HomeViewProps {
  dailyQuote: Quote;
  allQuotes: Quote[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onOpenCardStudio: (quote: Quote) => void;
  onSelectCategory: (catId: CategoryId) => void;
  onGoToChat: () => void;
  onOpenAIGenerator: () => void;
  theme: 'dark' | 'sepia';
  onRegenerateDaily?: () => void;
  isRefreshingDaily?: boolean;
  onOpenDailyArchive?: () => void;
  historyCount?: number;
  onOpenNotificationModal?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  dailyQuote,
  allQuotes,
  favorites,
  onToggleFavorite,
  onOpenCardStudio,
  onSelectCategory,
  onGoToChat,
  onOpenAIGenerator,
  theme,
  onRegenerateDaily,
  isRefreshingDaily,
  onOpenDailyArchive,
  historyCount = 0,
  onOpenNotificationModal,
}) => {
  const categoryIcons: Record<string, any> = {
    solitude: Moon,
    existence: Compass,
    relationships: HeartHandshake,
    faint_hope: Sunset,
    letters: Feather,
  };

  return (
    <div className="space-y-7 pb-8 animate-ink">
      {/* 1. Daily Reflection Card */}
      <section>
        <DailyReflectionCard
          quote={dailyQuote}
          isFavorite={favorites.includes(dailyQuote.id)}
          onToggleFavorite={onToggleFavorite}
          onOpenCardStudio={onOpenCardStudio}
          theme={theme}
          onRegenerateDaily={onRegenerateDaily}
          isRefreshingDaily={isRefreshingDaily}
          onOpenArchive={onOpenDailyArchive}
          historyCount={historyCount}
          onOpenNotificationSettings={onOpenNotificationModal}
        />
      </section>

      {/* Quick Trigger: Generate Dazai Spark Across Books */}
      <section className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border border-dashed border-inherit/30 bg-black/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#C46868]/15 text-[#C46868] flex items-center justify-center font-bold text-sm">
            ✦
          </div>
          <div>
            <h4 className="font-amiri font-bold text-sm leading-tight">
              تريد استحضار شذرة من كتاب أو جانب محدد من شخصية دازاي؟
            </h4>
            <p className="text-[11px] opacity-65 font-sans-ui mt-0.5">
              اختر بين: لم أعد إنساناً، شمس الغروب، تسوغارو، اركض يا ميلوس، وحانة لوبين
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            audioManager.playInkDrop();
            onOpenAIGenerator();
          }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-amiri font-bold shadow-sm flex items-center gap-1.5 transition-all ${
            theme === 'dark'
              ? 'bg-[#8B3A3A] hover:bg-[#9F4242] text-white'
              : 'bg-[#7A3838] hover:bg-[#8F4343] text-white'
          }`}
        >
          <Feather className="w-3.5 h-3.5" />
          <span>إنشاء شذرة من كتب دازاي</span>
        </button>
      </section>

      {/* 2. Interactive Random Ink Generator */}
      <section>
        <RandomQuoteGenerator
          quotes={allQuotes}
          favorites={favorites}
          onToggleFavorite={onToggleFavorite}
          onOpenCardStudio={onOpenCardStudio}
          theme={theme}
        />
      </section>

      {/* 3. Dazai's Persona Chat Teaser */}
      <section
        onClick={() => {
          audioManager.playPaperRustle();
          onGoToChat();
        }}
        className={`p-5 rounded-2xl border cursor-pointer transition-all duration-300 relative overflow-hidden group ${
          theme === 'dark'
            ? 'bg-[#19191E] border-[#2C2C38] hover:border-[#8B3A3A]/70'
            : 'bg-[#FAF4EB] border-[#DECDB7] hover:border-[#7A3838]/70'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-kanji text-base border shadow-sm transition-transform group-hover:scale-105 ${
                theme === 'dark'
                  ? 'border-[#8B3A3A] bg-[#8B3A3A]/20 text-[#E89292]'
                  : 'border-[#7A3838] bg-[#7A3838]/15 text-[#7A3838]'
              }`}
            >
              太宰
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-amiri font-bold text-lg leading-tight">
                  مجلس روح دازاي الأدبي
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#8B3A3A]/15 text-[#C46868] font-sans-ui">
                  حوار تفاعلي
                </span>
              </div>
              <p className="text-xs opacity-65 font-amiri mt-0.5 line-clamp-1">
                تحدث مع روح دازاي، الصديق المتأمل، المعلم الأدبي، أو يوزو أوبا
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-amiri font-bold text-[#C46868]">
            <span>ابدأ الحوار</span>
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          </div>
        </div>
      </section>

      {/* 4. Browse by Thematic Worlds (أقسام عوالم دازاي الداخلية) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-amiri text-lg font-bold">عوالم دازاي الداخلية</h3>
            <p className="text-xs opacity-60 font-kanji">太宰治の内なる世界</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CATEGORIES.map((cat) => {
            const Icon = categoryIcons[cat.id] || BookOpen;
            const count = allQuotes.filter((q) => q.category === cat.id).length;

            return (
              <div
                key={cat.id}
                onClick={() => {
                  audioManager.playPaperRustle();
                  onSelectCategory(cat.id);
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 group ${
                  theme === 'dark'
                    ? 'bg-[#18181C] border-[#2A2A35] hover:border-[#3E3E4E] hover:bg-[#1E1E24]'
                    : 'bg-[#FAF4EB] border-[#DECDB7] hover:border-[#CFBFA8] hover:bg-[#F3ECE0]'
                }`}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2 rounded-lg ${
                        theme === 'dark'
                          ? 'bg-[#22222B] text-[#C46868]'
                          : 'bg-[#EAE0D0] text-[#7A3838]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-amiri font-bold text-base leading-tight group-hover:text-[#C46868] transition-colors">
                        {cat.name}
                      </h4>
                      <span className="font-kanji text-[10px] opacity-60">
                        {cat.kanji}
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] font-sans-ui opacity-50 px-2 py-0.5 rounded border border-inherit/20">
                    {count} شذرات
                  </span>
                </div>

                <p className="text-xs opacity-65 font-amiri leading-relaxed line-clamp-2 mt-1">
                  {cat.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Shōwa Era Literary Note */}
      <section
        className={`p-4 rounded-xl border text-center text-xs leading-relaxed font-amiri opacity-70 ${
          theme === 'dark'
            ? 'bg-[#121215] border-[#24242D]'
            : 'bg-[#F0E6D5] border-[#D8C7B0]'
        }`}
      >
        <p>
          « وُلد أوسامو دازاي عام ١٩٠٩ في مقاطعة أوموري شمال اليابان، وتوفي عام ١٩٤٨ في طوكيو.
          تظل كتاباته مرآة صريحة لهشاشة الإنسان وصدق المشاعر التي لا تبهت مع تقادم السنين. »
        </p>
      </section>
    </div>
  );
};
