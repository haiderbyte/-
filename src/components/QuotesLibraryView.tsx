import React, { useState, useMemo } from 'react';
import { Quote, CategoryId } from '../types';
import { CATEGORIES } from '../data/quotesData';
import { QuoteCard } from './QuoteCard';
import {
  Search,
  Filter,
  Bookmark,
  Sparkles,
  Feather,
  SlidersHorizontal,
  X,
  HardDriveDownload,
} from 'lucide-react';
import { audioManager } from '../utils/sound';
import { isQuotePermanentlySaved } from '../utils/storage';

interface QuotesLibraryViewProps {
  quotes: Quote[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onOpenCardStudio: (quote: Quote) => void;
  onOpenAIGenerator: () => void;
  theme: 'dark' | 'sepia';
  initialCategory?: CategoryId | 'all' | 'favorites' | 'daily' | 'permanent';
}

export const QuotesLibraryView: React.FC<QuotesLibraryViewProps> = ({
  quotes,
  favorites,
  onToggleFavorite,
  onOpenCardStudio,
  onOpenAIGenerator,
  theme,
  initialCategory = 'all',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<
    CategoryId | 'all' | 'favorites' | 'daily' | 'permanent'
  >(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');

  // Permanent saved quotes count
  const permanentlySavedCount = useMemo(() => {
    return quotes.filter((q) => isQuotePermanentlySaved(q.id, q.textAr)).length;
  }, [quotes]);

  // Daily quotes count
  const dailyQuotesCount = useMemo(() => {
    return quotes.filter(
      (q) => q.isDailyFeatured || q.isAiGenerated || q.dailyDate || q.tags?.includes('شذرة اليوم')
    ).length;
  }, [quotes]);

  // Filtered quotes based on category and search query
  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) => {
      // Category filter
      if (selectedCategory === 'favorites') {
        if (!favorites.includes(q.id)) return false;
      } else if (selectedCategory === 'permanent') {
        if (!isQuotePermanentlySaved(q.id, q.textAr)) return false;
      } else if (selectedCategory === 'daily') {
        const isDaily = q.isDailyFeatured || q.isAiGenerated || q.dailyDate || q.tags?.includes('شذرة اليوم');
        if (!isDaily) return false;
      } else if (selectedCategory !== 'all') {
        if (q.category !== selectedCategory) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchText = q.textAr.toLowerCase().includes(query);
        const matchJp = q.textJp.toLowerCase().includes(query);
        const matchSource = q.source.toLowerCase().includes(query);
        const matchReflection = q.reflection?.toLowerCase().includes(query);
        const matchTags = q.tags.some((t) => t.toLowerCase().includes(query));

        return matchText || matchJp || matchSource || matchReflection || matchTags;
      }

      return true;
    });
  }, [quotes, selectedCategory, searchQuery, favorites]);

  return (
    <div className="space-y-5 animate-ink">
      {/* Header & AI Generator Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-amiri text-2xl font-bold">مكتبة الشذرات والاقتباسات</h2>
          <p className="text-xs opacity-60 font-kanji">太宰治 文学断片アーカイブ</p>
        </div>

        <button
          onClick={onOpenAIGenerator}
          className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-amiri font-bold shadow-md transition-all self-start sm:self-auto ${
            theme === 'dark'
              ? 'bg-[#8B3A3A] hover:bg-[#9E4242] text-[#FAF6EE]'
              : 'bg-[#7A3838] hover:bg-[#8E4343] text-white'
          }`}
        >
          <Feather className="w-3.5 h-3.5" />
          <span>توليد شذرة جديدة بالذكاء الاصطناعي</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div
        className={`relative flex items-center rounded-xl border transition-colors ${
          theme === 'dark'
            ? 'bg-[#18181C] border-[#2C2C36] text-[#E2D9C8]'
            : 'bg-[#FAF4EB] border-[#DECDB7] text-[#2C241D]'
        }`}
      >
        <Search className="w-4 h-4 mr-3.5 ml-2 opacity-50" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث في نصوص دازاي، الروايات، الكانجي، أو الوسوم..."
          className="w-full bg-transparent text-sm font-amiri py-2.5 pr-1 pl-8 outline-none placeholder:opacity-45"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute left-3 p-1 opacity-60 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Filter Chips / Buttons */}
      <div className="overflow-x-auto pb-1 flex items-center gap-2 no-scrollbar">
        {/* All button */}
        <button
          onClick={() => {
            audioManager.playPaperRustle();
            setSelectedCategory('all');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-amiri font-bold border transition-all whitespace-nowrap ${
            selectedCategory === 'all'
              ? theme === 'dark'
                ? 'bg-[#8B3A3A] border-[#8B3A3A] text-white shadow-sm'
                : 'bg-[#7A3838] border-[#7A3838] text-white shadow-sm'
              : 'border-inherit/20 opacity-70 hover:opacity-100 hover:bg-inherit/10'
          }`}
        >
          الكل ({quotes.length})
        </button>

        {/* Favorites button */}
        <button
          onClick={() => {
            audioManager.playPaperRustle();
            setSelectedCategory('favorites');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-amiri font-bold border transition-all whitespace-nowrap flex items-center gap-1.5 ${
            selectedCategory === 'favorites'
              ? theme === 'dark'
                ? 'bg-[#8B3A3A] border-[#8B3A3A] text-white shadow-sm'
                : 'bg-[#7A3838] border-[#7A3838] text-white shadow-sm'
              : 'border-inherit/20 opacity-70 hover:opacity-100 hover:bg-inherit/10'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5 fill-current" />
          <span>المفضلة ({favorites.length})</span>
        </button>

        {/* Permanently Saved Quotes button (المحفوظة محلياً مدى الحياة) */}
        <button
          onClick={() => {
            audioManager.playPaperRustle();
            setSelectedCategory('permanent');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-amiri font-bold border transition-all whitespace-nowrap flex items-center gap-1.5 ${
            selectedCategory === 'permanent'
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
              : 'border-inherit/20 opacity-70 hover:opacity-100 hover:bg-inherit/10'
          }`}
          title="عرض الشذرات المحفوظة محلياً مدى الحياة في جهازك"
        >
          <HardDriveDownload className="w-3.5 h-3.5 text-emerald-400" />
          <span>المحفوظة محلياً ({permanentlySavedCount})</span>
        </button>

        {/* Daily AI Quotes button */}
        <button
          onClick={() => {
            audioManager.playPaperRustle();
            setSelectedCategory('daily');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-amiri font-bold border transition-all whitespace-nowrap flex items-center gap-1.5 ${
            selectedCategory === 'daily'
              ? theme === 'dark'
                ? 'bg-[#8B3A3A] border-[#8B3A3A] text-white shadow-sm'
                : 'bg-[#7A3838] border-[#7A3838] text-white shadow-sm'
              : 'border-inherit/20 opacity-70 hover:opacity-100 hover:bg-inherit/10'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#C46868]" />
          <span>شذرات الأيام ({dailyQuotesCount})</span>
        </button>

        {/* Individual Category buttons */}
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count = quotes.filter((q) => q.category === cat.id).length;

          return (
            <button
              key={cat.id}
              onClick={() => {
                audioManager.playPaperRustle();
                setSelectedCategory(cat.id);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-amiri font-bold border transition-all whitespace-nowrap flex items-center gap-1.5 ${
                isSelected
                  ? theme === 'dark'
                    ? 'bg-[#8B3A3A] border-[#8B3A3A] text-white shadow-sm'
                    : 'bg-[#7A3838] border-[#7A3838] text-white shadow-sm'
                  : 'border-inherit/20 opacity-70 hover:opacity-100 hover:bg-inherit/10'
              }`}
            >
              <span>{cat.name}</span>
              <span className="opacity-60 text-[10px] font-sans-ui">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Results Count & Current Filter Indicator */}
      <div className="flex items-center justify-between text-xs opacity-60 px-1">
        <span>
          عرض {filteredQuotes.length} من أصل {quotes.length} شذرة
        </span>
        {selectedCategory !== 'all' && (
          <button
            onClick={() => setSelectedCategory('all')}
            className="hover:underline text-[#C46868] font-amiri"
          >
            إعادة تعيين التصنيف
          </button>
        )}
      </div>

      {/* Quotes Cards Grid / List */}
      {filteredQuotes.length === 0 ? (
        <div
          className={`text-center py-14 px-4 rounded-2xl border ${
            theme === 'dark'
              ? 'bg-[#18181C]/50 border-[#2A2A35]'
              : 'bg-[#FAF4EB]/50 border-[#DECDB7]'
          }`}
        >
          <Sparkles className="w-8 h-8 text-[#C46868] mx-auto mb-3 opacity-60" />
          <h3 className="font-amiri text-lg font-bold">لا توجد شذرات تطابق هذا البحث</h3>
          <p className="text-xs opacity-60 max-w-sm mx-auto mt-1 leading-relaxed">
            جرب كلمات بحث أخرى، أو اضغط زر التوليد لصياغة شذرة جديدة كلياً بأسلوب دازاي.
          </p>
          <button
            onClick={onOpenAIGenerator}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-amiri bg-[#8B3A3A] text-white font-bold"
          >
            توليد شذرة حول هذا الموضوع
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredQuotes.map((quote) => (
            <QuoteCard
              key={quote.id}
              quote={quote}
              isFavorite={favorites.includes(quote.id)}
              onToggleFavorite={onToggleFavorite}
              onOpenCardStudio={onOpenCardStudio}
              theme={theme}
            />
          ))}
        </div>
      )}
    </div>
  );
};
