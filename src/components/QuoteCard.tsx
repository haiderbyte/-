import React, { useState } from 'react';
import { Quote } from '../types';
import {
  Bookmark,
  Share2,
  Copy,
  Check,
  Volume2,
  VolumeX,
  ChevronDown,
  Sparkles,
  HardDriveDownload,
  Maximize2,
  BookOpen,
} from 'lucide-react';
import { audioManager } from '../utils/sound';
import { isQuotePermanentlySaved, togglePermanentlySavedQuote } from '../utils/storage';

interface QuoteCardProps {
  quote: Quote;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onOpenCardStudio: (quote: Quote) => void;
  onEnterFocusMode?: (quote: Quote) => void;
  theme: 'dark' | 'sepia';
}

export const QuoteCard: React.FC<QuoteCardProps> = ({
  quote,
  isFavorite,
  onToggleFavorite,
  onOpenCardStudio,
  onEnterFocusMode,
  theme,
}) => {
  const [copied, setCopied] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [isPermanentlySaved, setIsPermanentlySaved] = useState(() =>
    isQuotePermanentlySaved(quote.id, quote.textAr)
  );

  React.useEffect(() => {
    setIsPermanentlySaved(isQuotePermanentlySaved(quote.id, quote.textAr));
  }, [quote.id, quote.textAr]);

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
    utterance.rate = 0.88; // Calm, thoughtful literary pacing
    utterance.pitch = 0.95;

    utterance.onend = () => setIsPlayingVoice(false);
    utterance.onerror = () => setIsPlayingVoice(false);

    setIsPlayingVoice(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <article
      className={`relative rounded-xl p-5 sm:p-6 transition-all duration-300 border ${
        theme === 'dark'
          ? 'bg-[#1A1A1E] border-[#2A2A32] text-[#E2D9C8] hover:border-[#3A3A46]'
          : 'bg-[#FAF4EB] border-[#E5DAC8] text-[#2C241D] hover:border-[#D6C7B0]'
      }`}
    >
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-inherit/20 text-xs">
        <div className="flex items-center gap-2">
          <span
            className={`font-kanji text-[11px] px-2 py-0.5 rounded border ${
              theme === 'dark'
                ? 'border-[#8B3A3A]/40 bg-[#8B3A3A]/10 text-[#D47A7A]'
                : 'border-[#7A3838]/30 bg-[#7A3838]/10 text-[#7A3838]'
            }`}
          >
            太宰治
          </span>
          <span className="opacity-75 font-amiri text-sm font-medium">{quote.source}</span>
          <span className="opacity-40">·</span>
          <span className="opacity-60 text-[11px] font-sans-ui">{quote.chapter}</span>
        </div>

        <div className="flex items-center gap-2">
          {quote.textAr.length > 70 && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-amiri font-bold ${
                theme === 'dark'
                  ? 'bg-[#8B3A3A]/25 text-[#E89292] border border-[#8B3A3A]/40'
                  : 'bg-[#7A3838]/15 text-[#7A3838] border border-[#7A3838]/30'
              }`}
            >
              شذرة طويلة
            </span>
          )}
          <span className="font-cinzel text-xs opacity-50">{quote.year}</span>
        </div>
      </div>

      {/* Main Quote Arabic Text */}
      <div className="relative my-3">
        <span
          className={`absolute -top-4 -right-2 text-4xl font-serif select-none pointer-events-none ${
            theme === 'dark' ? 'text-[#8B3A3A]/20' : 'text-[#7A3838]/20'
          }`}
        >
          “
        </span>
        <blockquote className="quote-text text-lg sm:text-xl font-bold leading-relaxed pr-2">
          {quote.textAr}
        </blockquote>
      </div>

      {/* Japanese Original Excerpt */}
      {quote.textJp && (
        <div
          dir="ltr"
          className={`mt-3 pt-2 font-kanji text-xs tracking-wider opacity-65 border-t border-dashed border-inherit/20 select-text ${
            theme === 'dark' ? 'text-[#C5BAA8]' : 'text-[#5A4E42]'
          }`}
        >
          {quote.textJp}
        </div>
      )}

      {/* Deep Reflection Accordion */}
      {quote.reflection && (
        <div className="mt-3">
          <button
            onClick={() => {
              audioManager.playPaperRustle();
              setShowReflection(!showReflection);
            }}
            className={`text-xs flex items-center gap-1.5 font-amiri transition-colors ${
              theme === 'dark'
                ? 'text-[#C46868] hover:text-[#E08A8A]'
                : 'text-[#7A3838] hover:text-[#5A2828]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{showReflection ? 'إخفاء الشذرة التأملية' : 'تأمل في عمق العبارة'}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                showReflection ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showReflection && (
            <div
              className={`mt-2 p-3 rounded-lg text-xs leading-relaxed font-amiri transition-all animate-ink ${
                theme === 'dark'
                  ? 'bg-[#121215] border border-[#2B2B34] text-[#C5BAA8]'
                  : 'bg-[#F0E6D5] border border-[#DDD0BC] text-[#4A3D31]'
              }`}
            >
              {quote.reflection}
            </div>
          )}
        </div>
      )}

      {/* Bottom Action Footer */}
      <div className="mt-4 pt-3 border-t border-inherit/20 flex items-center justify-between text-xs">
        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1.5 opacity-70">
          {quote.tags.slice(0, 2).map((t, idx) => (
            <span key={idx} className="text-[11px] font-sans-ui">
              #{t}
            </span>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Read Out Aloud */}
          <button
            onClick={handleSpeech}
            className={`p-2 rounded-lg transition-colors ${
              isPlayingVoice
                ? 'text-[#C46868] bg-[#8B3A3A]/20'
                : 'opacity-70 hover:opacity-100 hover:bg-inherit/10'
            }`}
            title="الاستماع بصوت هادئ"
            aria-label="قراءة صوتية"
          >
            {isPlayingVoice ? (
              <VolumeX className="w-4 h-4 text-[#C46868]" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>

          {/* Copy Text Button */}
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-amiri transition-all ${
              copied
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : theme === 'dark'
                ? 'border-[#33333E] hover:bg-[#25252D] text-[#C5BAA8]'
                : 'border-[#DECDB7] hover:bg-[#EFE4D3] text-[#55473B]'
            }`}
            title="نسخ العبارة الأدبية ومصدرها"
            aria-label="نسخ"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-bold text-emerald-400">تم النسخ</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#C46868]" />
                <span className="text-[11px] font-bold">نسخ</span>
              </>
            )}
          </button>

          {/* Permanent Lifetime Local Save Button */}
          <button
            onClick={handleTogglePermanentSave}
            className={`p-2 rounded-lg transition-colors border ${
              isPermanentlySaved
                ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-400'
                : 'border-transparent opacity-70 hover:opacity-100 hover:bg-inherit/10'
            }`}
            title={
              isPermanentlySaved
                ? 'محفوظة محلياً مدى الحياة في جهازك (انقر للإلغاء)'
                : 'حفظ هذه الشذرة محلياً مدى الحياة في جهازك'
            }
            aria-label="حفظ محلي مدى الحياة"
          >
            <HardDriveDownload
              className={`w-4 h-4 ${
                isPermanentlySaved ? 'text-emerald-400' : 'text-[#C46868]'
              }`}
            />
          </button>

          {/* Bookmark / Favorite */}
          <button
            onClick={() => {
              audioManager.playPaperRustle();
              onToggleFavorite(quote.id);
            }}
            className={`p-2 rounded-lg transition-colors ${
              isFavorite
                ? 'text-[#C46868] bg-[#8B3A3A]/15'
                : 'opacity-70 hover:opacity-100 hover:bg-inherit/10'
            }`}
            title={isFavorite ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
            aria-label="مفضلة"
          >
            <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          {/* Reading Focus Mode Button */}
          {onEnterFocusMode && (
            <button
              onClick={() => {
                audioManager.playPaperRustle();
                onEnterFocusMode(quote);
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-amiri font-bold transition-all ${
                quote.textAr.length > 70
                  ? theme === 'dark'
                    ? 'bg-[#8B3A3A]/25 border-[#8B3A3A] text-[#FAF6EE] hover:bg-[#8B3A3A]/35 shadow-sm'
                    : 'bg-[#7A3838]/15 border-[#7A3838] text-[#7A3838] hover:bg-[#7A3838]/25 shadow-sm'
                  : theme === 'dark'
                  ? 'border-[#33333E] hover:bg-[#25252D] text-[#C5BAA8]'
                  : 'border-[#DECDB7] hover:bg-[#EFE4D3] text-[#55473B]'
              }`}
              title="قراءة في نمط التركيز مع إخفاء شريط التنقل مؤقتاً"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>نمط التركيز</span>
            </button>
          )}

          {/* Open Card Studio */}
          <button
            onClick={() => {
              audioManager.playSingingBowl();
              onOpenCardStudio(quote);
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-amiri font-bold transition-all ${
              theme === 'dark'
                ? 'bg-[#8B3A3A]/20 border-[#8B3A3A]/50 text-[#FAF6EE] hover:bg-[#8B3A3A]/30'
                : 'bg-[#7A3838]/15 border-[#7A3838]/40 text-[#7A3838] hover:bg-[#7A3838]/25'
            }`}
            title="صناعة بطاقة مشاركة احترافية"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>بطاقة</span>
          </button>
        </div>
      </div>
    </article>
  );
};
