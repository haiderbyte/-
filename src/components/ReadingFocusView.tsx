import React, { useState, useEffect } from 'react';
import { Quote } from '../types';
import {
  ArrowRight,
  Maximize2,
  Minimize2,
  Bookmark,
  Share2,
  Copy,
  Check,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  HardDriveDownload,
  BookOpen,
  Eye,
  Type,
} from 'lucide-react';
import { audioManager } from '../utils/sound';
import { isQuotePermanentlySaved, togglePermanentlySavedQuote } from '../utils/storage';

interface ReadingFocusViewProps {
  quote: Quote;
  allQuotes: Quote[];
  onExitFocusMode: () => void;
  onSelectQuote: (quote: Quote) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onOpenCardStudio: (quote: Quote) => void;
  theme: 'dark' | 'sepia';
}

export const ReadingFocusView: React.FC<ReadingFocusViewProps> = ({
  quote,
  allQuotes,
  onExitFocusMode,
  onSelectQuote,
  favorites,
  onToggleFavorite,
  onOpenCardStudio,
  theme,
}) => {
  const [copied, setCopied] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [fontSizeLevel, setFontSizeLevel] = useState<'md' | 'lg' | 'xl'>('lg');
  const [isPermanentlySaved, setIsPermanentlySaved] = useState(() =>
    isQuotePermanentlySaved(quote.id, quote.textAr)
  );

  useEffect(() => {
    setIsPermanentlySaved(isQuotePermanentlySaved(quote.id, quote.textAr));
  }, [quote.id, quote.textAr]);

  // Support Escape key to exit focus mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExitFocusMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExitFocusMode]);

  const currentIndex = allQuotes.findIndex((q) => q.id === quote.id);
  const prevQuote = currentIndex > 0 ? allQuotes[currentIndex - 1] : null;
  const nextQuote = currentIndex < allQuotes.length - 1 ? allQuotes[currentIndex + 1] : null;

  const handleTogglePermanentSave = () => {
    audioManager.playSingingBowl();
    const result = togglePermanentlySavedQuote(quote);
    setIsPermanentlySaved(result.isSaved);
  };

  const handleCopy = async () => {
    try {
      const shareText = `« ${quote.textAr} »\n\n— ${quote.source} (${quote.chapter})\nأوسامو دازاي · 太宰治`;
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      audioManager.playPaperRustle();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleSpeech = () => {
    if (!('speechSynthesis' in window)) return;

    if (isPlayingVoice) {
      window.speechSynthesis.cancel();
      setIsPlayingVoice(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(quote.textAr);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.85; // Calm literary cadence
    utterance.pitch = 0.95;

    utterance.onend = () => setIsPlayingVoice(false);
    utterance.onerror = () => setIsPlayingVoice(false);

    setIsPlayingVoice(true);
    window.speechSynthesis.speak(utterance);
  };

  const isFav = favorites.includes(quote.id);
  const wordCount = quote.textAr.trim().split(/\s+/).length;
  const estimatedReadingSeconds = Math.max(8, Math.round(wordCount * 0.45));

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 animate-ink pb-8">
      {/* Top Sticky Bar: Focus Mode Status & Return to Normal Mode Button */}
      <div
        className={`sticky top-16 z-30 p-3 sm:p-4 rounded-2xl border backdrop-blur-md transition-all shadow-md flex items-center justify-between gap-3 flex-wrap ${
          theme === 'dark'
            ? 'bg-[#18181D]/90 border-[#333342] text-[#E2D9C8]'
            : 'bg-[#FAF4EB]/90 border-[#DECDB7] text-[#2C241D]'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {/* Prominent Return Button */}
          <button
            onClick={() => {
              audioManager.playPaperRustle();
              onExitFocusMode();
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-amiri font-bold flex items-center gap-2 transition-all shadow-md group ${
              theme === 'dark'
                ? 'bg-[#8B3A3A] hover:bg-[#9F4242] text-[#FAF6EE]'
                : 'bg-[#7A3838] hover:bg-[#8F4343] text-white'
            }`}
            title="العودة للوضع العادي وإظهار شريط التنقل"
          >
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            <span className="text-sm">العودة للوضع العادي</span>
          </button>

          <div className="hidden sm:flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold font-amiri text-[#C46868]">
                نمط التركيز للقراءة نشط
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-sans-ui">
                تم إخفاء شريط التنقل
              </span>
            </div>
            <span className="text-[11px] opacity-60 font-kanji">
              قراءة هادئة خالية من التشتيت (Escape للعودة)
            </span>
          </div>
        </div>

        {/* Font Size & Controls */}
        <div className="flex items-center gap-2">
          {/* Font Size Selector */}
          <div className="flex items-center gap-1 p-1 rounded-xl border border-inherit/20 bg-black/10 text-xs font-amiri">
            <button
              onClick={() => setFontSizeLevel('md')}
              className={`px-2 py-1 rounded-lg transition-colors ${
                fontSizeLevel === 'md'
                  ? 'bg-inherit/25 font-bold shadow-sm'
                  : 'opacity-60 hover:opacity-100'
              }`}
              title="خط مريح"
            >
              أ-
            </button>
            <button
              onClick={() => setFontSizeLevel('lg')}
              className={`px-2 py-1 rounded-lg transition-colors ${
                fontSizeLevel === 'lg'
                  ? 'bg-inherit/25 font-bold shadow-sm'
                  : 'opacity-60 hover:opacity-100'
              }`}
              title="خط متوسط"
            >
              أ
            </button>
            <button
              onClick={() => setFontSizeLevel('xl')}
              className={`px-2 py-1 rounded-lg transition-colors ${
                fontSizeLevel === 'xl'
                  ? 'bg-inherit/25 font-bold shadow-sm'
                  : 'opacity-60 hover:opacity-100'
              }`}
              title="خط كبير جداً"
            >
              أ+
            </button>
          </div>

          {/* Quick Counter */}
          <span className="text-xs opacity-60 font-sans-ui hidden md:inline px-2">
            {currentIndex + 1} / {allQuotes.length}
          </span>
        </div>
      </div>

      {/* Main Focus Reading Canvas */}
      <article
        className={`relative rounded-3xl p-6 sm:p-10 md:p-12 border shadow-xl transition-all duration-300 font-amiri ${
          theme === 'dark'
            ? 'bg-[#18181D] border-[#2E2E3A] text-[#FAF6EE]'
            : 'bg-[#FAF5ED] border-[#DED1BF] text-[#2C241D]'
        }`}
      >
        {/* Subtle Watermark Kanji */}
        <div className="absolute top-6 left-6 font-kanji text-6xl sm:text-7xl opacity-5 select-none pointer-events-none">
          太宰
        </div>

        {/* Meta Header */}
        <div className="flex items-center justify-between gap-3 pb-4 mb-6 border-b border-inherit/15 flex-wrap">
          <div className="flex items-center gap-2.5">
            <span
              className={`font-kanji text-xs px-2.5 py-1 rounded-lg border shadow-inner ${
                theme === 'dark'
                  ? 'border-[#8B3A3A]/50 bg-[#8B3A3A]/20 text-[#E89292]'
                  : 'border-[#7A3838]/40 bg-[#7A3838]/15 text-[#7A3838]'
              }`}
            >
              太宰治
            </span>
            <div className="flex items-center gap-1.5 text-sm sm:text-base">
              <span className="font-bold opacity-90">{quote.source}</span>
              <span className="opacity-40">·</span>
              <span className="opacity-70 text-xs sm:text-sm font-sans-ui">
                {quote.chapter}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs opacity-60 font-sans-ui">
            <span>سنة {quote.year}</span>
            <span>·</span>
            <span>~{estimatedReadingSeconds} ثانية قراءة</span>
          </div>
        </div>

        {/* Arabic Quote Text in Grand Immersion Style */}
        <div className="my-6 sm:my-8 relative">
          <span
            className={`absolute -top-6 -right-4 text-5xl sm:text-6xl font-serif select-none pointer-events-none opacity-20 ${
              theme === 'dark' ? 'text-[#8B3A3A]' : 'text-[#7A3838]'
            }`}
          >
            “
          </span>

          <blockquote
            className={`font-amiri font-bold leading-[2.1] sm:leading-[2.2] tracking-wide text-right select-text pr-2 sm:pr-4 ${
              fontSizeLevel === 'md'
                ? 'text-xl sm:text-2xl'
                : fontSizeLevel === 'lg'
                ? 'text-2xl sm:text-3xl'
                : 'text-3xl sm:text-4xl'
            }`}
          >
            {quote.textAr}
          </blockquote>
        </div>

        {/* Original Japanese Excerpt */}
        {quote.textJp && (
          <div
            dir="ltr"
            className={`mt-6 pt-4 border-t border-dashed border-inherit/25 font-kanji text-sm sm:text-base tracking-wider leading-relaxed select-text opacity-75 ${
              theme === 'dark' ? 'text-[#D0C6B4]' : 'text-[#504437]'
            }`}
          >
            {quote.textJp}
          </div>
        )}

        {/* Deep Reflection Section */}
        {quote.reflection && (
          <div
            className={`mt-8 p-5 sm:p-6 rounded-2xl border transition-all animate-ink ${
              theme === 'dark'
                ? 'bg-[#121216] border-[#2C2C38] text-[#D2C8B8]'
                : 'bg-[#F2E7D5] border-[#D8C7B0] text-[#3D3025]'
            }`}
          >
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-[#C46868]">
              <Sparkles className="w-4 h-4" />
              <span>تأمل في كواليس النص الأدبي</span>
            </div>
            <p className="text-base sm:text-lg leading-relaxed font-amiri select-text">
              {quote.reflection}
            </p>
          </div>
        )}

        {/* Tags */}
        <div className="mt-8 pt-4 border-t border-inherit/15 flex items-center justify-between flex-wrap gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {quote.tags.map((t, idx) => (
              <span
                key={idx}
                className="text-xs px-2.5 py-1 rounded-lg bg-inherit/10 border border-inherit/15 font-sans-ui opacity-75"
              >
                #{t}
              </span>
            ))}
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Audio Speech */}
            <button
              onClick={handleSpeech}
              className={`p-2.5 rounded-xl border text-xs flex items-center gap-1.5 transition-colors ${
                isPlayingVoice
                  ? 'border-[#C46868] text-[#C46868] bg-[#8B3A3A]/20'
                  : 'border-inherit/20 hover:bg-inherit/10 opacity-75 hover:opacity-100'
              }`}
              title="الاستماع الصوتي الهادئ"
            >
              {isPlayingVoice ? (
                <>
                  <VolumeX className="w-4 h-4 text-[#C46868]" />
                  <span className="text-[#C46868]">إيقاف</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>استماع</span>
                </>
              )}
            </button>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className="p-2.5 rounded-xl border border-inherit/20 hover:bg-inherit/10 text-xs flex items-center gap-1.5 opacity-75 hover:opacity-100 transition-colors"
              title="نسخ الاقتباس"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">تم النسخ</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>نسخ</span>
                </>
              )}
            </button>

            {/* Permanent Save */}
            <button
              onClick={handleTogglePermanentSave}
              className={`p-2.5 rounded-xl border text-xs flex items-center gap-1.5 transition-colors ${
                isPermanentlySaved
                  ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400'
                  : 'border-inherit/20 hover:bg-inherit/10 opacity-75 hover:opacity-100'
              }`}
              title="حفظ محلي دائم في الجهاز"
            >
              <HardDriveDownload className="w-4 h-4" />
              <span>{isPermanentlySaved ? 'محفوظ محلياً' : 'حفظ دائم'}</span>
            </button>

            {/* Favorite */}
            <button
              onClick={() => {
                audioManager.playPaperRustle();
                onToggleFavorite(quote.id);
              }}
              className={`p-2.5 rounded-xl border text-xs flex items-center gap-1.5 transition-colors ${
                isFav
                  ? 'border-[#C46868] text-[#C46868] bg-[#8B3A3A]/20'
                  : 'border-inherit/20 hover:bg-inherit/10 opacity-75 hover:opacity-100'
              }`}
              title="إضافة للمفضلة"
            >
              <Bookmark className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
              <span>{isFav ? 'في المفضلة' : 'مفضلة'}</span>
            </button>

            {/* Open Card Studio */}
            <button
              onClick={() => {
                audioManager.playSingingBowl();
                onOpenCardStudio(quote);
              }}
              className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                theme === 'dark'
                  ? 'border-[#8B3A3A] bg-[#8B3A3A]/20 text-[#FAF6EE] hover:bg-[#8B3A3A]/30'
                  : 'border-[#7A3838] bg-[#7A3838]/15 text-[#7A3838] hover:bg-[#7A3838]/25'
              }`}
              title="صناعة بطاقة مشاركة"
            >
              <Share2 className="w-4 h-4" />
              <span>بطاقة</span>
            </button>
          </div>
        </div>
      </article>

      {/* Bottom Floating Navigation for Next / Prev Quote & Return Button */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          {prevQuote ? (
            <button
              onClick={() => {
                audioManager.playPaperRustle();
                onSelectQuote(prevQuote);
              }}
              className="px-3.5 py-2 rounded-xl border border-inherit/20 hover:bg-inherit/10 text-xs font-amiri flex items-center gap-1.5 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
              <span>الشذرة السابقة</span>
            </button>
          ) : (
            <div />
          )}

          {nextQuote && (
            <button
              onClick={() => {
                audioManager.playPaperRustle();
                onSelectQuote(nextQuote);
              }}
              className="px-3.5 py-2 rounded-xl border border-inherit/20 hover:bg-inherit/10 text-xs font-amiri flex items-center gap-1.5 transition-colors"
            >
              <span>الشذرة التالية</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Big Bottom Return Button */}
        <button
          onClick={() => {
            audioManager.playPaperRustle();
            onExitFocusMode();
          }}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-amiri font-bold flex items-center gap-2 transition-all shadow-md ${
            theme === 'dark'
              ? 'bg-[#22222B] hover:bg-[#2C2C36] text-[#FAF6EE] border border-[#3A3A4A]'
              : 'bg-[#EAE0D0] hover:bg-[#DDD2BF] text-[#2C241D] border border-[#D0C0A8]'
          }`}
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة للوضع العادي للمكتبة</span>
        </button>
      </div>
    </div>
  );
};
