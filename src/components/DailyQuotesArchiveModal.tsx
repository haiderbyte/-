import React, { useState } from 'react';
import { Quote, DailyAIQuoteRecord } from '../types';
import { getDailyQuotesHistory, cleanQuoteText } from '../utils/dailyQuoteManager';
import {
  Calendar,
  Sparkles,
  Share2,
  Bookmark,
  Copy,
  Check,
  X,
  Volume2,
  VolumeX,
  Clock,
  Cpu,
  BookOpen,
  HardDriveDownload,
} from 'lucide-react';
import { audioManager } from '../utils/sound';
import { isQuotePermanentlySaved, togglePermanentlySavedQuote } from '../utils/storage';

interface DailyQuotesArchiveModalProps {
  onClose: () => void;
  onOpenCardStudio: (quote: Quote) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  theme: 'dark' | 'sepia';
}

export const DailyQuotesArchiveModal: React.FC<DailyQuotesArchiveModalProps> = ({
  onClose,
  onOpenCardStudio,
  favorites,
  onToggleFavorite,
  theme,
}) => {
  const [history, setHistory] = useState<DailyAIQuoteRecord[]>(() => getDailyQuotesHistory());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [savedPermanentMap, setSavedPermanentMap] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    const hist = getDailyQuotesHistory();
    hist.forEach((h) => {
      if (h.quote) {
        map[h.quote.id] = isQuotePermanentlySaved(h.quote.id, h.quote.textAr);
      }
    });
    return map;
  });

  const handleTogglePermanent = (quote: Quote) => {
    audioManager.playSingingBowl();
    const result = togglePermanentlySavedQuote(quote);
    setSavedPermanentMap((prev) => ({
      ...prev,
      [quote.id]: result.isSaved,
    }));
  };

  const handleCopy = async (quote: Quote) => {
    try {
      const shareText = `« ${quote.textAr} »\n\n— ${quote.source} (${quote.chapter})\nأوسامو دازاي · 太宰治`;
      await navigator.clipboard.writeText(shareText);
      setCopiedId(quote.id);
      audioManager.playPaperRustle();
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
    }
  };

  const handleSpeech = (quote: Quote) => {
    if (!('speechSynthesis' in window)) return;

    if (playingId === quote.id) {
      window.speechSynthesis.cancel();
      setPlayingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(quote.textAr);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.85;
    utterance.pitch = 0.95;

    utterance.onend = () => setPlayingId(null);
    utterance.onerror = () => setPlayingId(null);

    setPlayingId(quote.id);
    window.speechSynthesis.speak(utterance);
  };

  const formatArabicDate = (dateKey: string) => {
    try {
      const [y, m, d] = dateKey.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString('ar-EG', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateKey;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-ink">
      <div
        className={`relative w-full max-w-2xl max-h-[88vh] flex flex-col rounded-2xl border shadow-2xl transition-colors ${
          theme === 'dark'
            ? 'bg-[#18181C] border-[#2E2E38] text-[#E2D9C8]'
            : 'bg-[#FAF4EB] border-[#DECDB7] text-[#2C241D]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-inherit/20 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm ${
                theme === 'dark'
                  ? 'border-[#8B3A3A] bg-[#8B3A3A]/20 text-[#E89292]'
                  : 'border-[#7A3838] bg-[#7A3838]/15 text-[#7A3838]'
              }`}
            >
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-amiri font-bold text-lg leading-tight flex items-center gap-2">
                <span>سجل شذرات الأيام المحفوظة محلياً</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-sans-ui border border-emerald-500/30">
                  {history.length} شذرة يومية
                </span>
              </h3>
              <p className="text-xs opacity-60 font-kanji">日々の断片アーカイブ · 毎日の知恵</p>
            </div>
          </div>

          <button
            onClick={() => {
              audioManager.playPaperRustle();
              onClose();
            }}
            className="p-2 rounded-lg hover:bg-inherit/10 opacity-70 hover:opacity-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
          {history.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <BookOpen className="w-10 h-10 mx-auto opacity-30 text-[#C46868]" />
              <p className="font-amiri text-base opacity-80">
                لم يتم تسجيل شذرات أيام سابقة بعد.
              </p>
              <p className="text-xs opacity-60 max-w-xs mx-auto font-sans-ui">
                سيقوم الذكاء الاصطناعي تلقائياً بتوليد شذرة أدبية جديدة كل يوم وحفظها محلياً في هذا السجل.
              </p>
            </div>
          ) : (
            history.map((record) => {
              const isFav = favorites.includes(record.quote.id);
              const isCopied = copiedId === record.quote.id;
              const isSpeechPlaying = playingId === record.quote.id;

              return (
                <div
                  key={record.quote.id}
                  className={`p-4 sm:p-5 rounded-xl border transition-all ${
                    theme === 'dark'
                      ? 'bg-[#1F1F24] border-[#2C2C36] hover:border-[#8B3A3A]/40'
                      : 'bg-[#F4ECE0] border-[#D9C7B0] hover:border-[#7A3838]/40'
                  }`}
                >
                  {/* Item Header */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-inherit/15">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-amiri font-bold text-[#C46868] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        {formatArabicDate(record.dateKey)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-mono opacity-65">
                      <span className="flex items-center gap-1 bg-inherit/20 px-2 py-0.5 rounded-md">
                        <Cpu className="w-2.5 h-2.5" />
                        {record.model || record.provider}
                      </span>
                    </div>
                  </div>

                  {/* Topic if present */}
                  {record.topic && (
                    <div className="text-[11px] font-sans-ui opacity-75 mb-2 flex items-center gap-1 text-[#C46868]">
                      <span>موضوع اليوم:</span>
                      <span className="italic font-amiri">{cleanQuoteText(record.topic)}</span>
                    </div>
                  )}

                  {/* Quote Text */}
                  <blockquote className="font-amiri text-base sm:text-lg font-bold leading-relaxed mb-2">
                    « {cleanQuoteText(record.quote.textAr)} »
                  </blockquote>

                  {record.quote.textJp && (
                    <p dir="ltr" className="font-kanji text-xs opacity-60 mb-2">
                      {record.quote.textJp}
                    </p>
                  )}

                  {record.quote.reflection && (
                    <div
                      className={`p-2.5 rounded-lg text-xs font-amiri leading-relaxed mb-3 ${
                        theme === 'dark'
                          ? 'bg-black/20 text-[#C5BAA8]'
                          : 'bg-white/40 text-[#4A3D31]'
                      }`}
                    >
                      <span className="font-bold text-[#C46868] ml-1">التأمل:</span>
                      {cleanQuoteText(record.quote.reflection)}
                    </div>
                  )}

                  {/* Item Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-inherit/10 text-xs">
                    <span className="opacity-60 text-[11px]">
                      {record.quote.source} · {record.quote.chapter}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleSpeech(record.quote)}
                        className={`p-1.5 rounded-md transition-colors ${
                          isSpeechPlaying ? 'text-[#C46868] bg-[#8B3A3A]/20' : 'hover:bg-inherit/10 opacity-70'
                        }`}
                        title="استماع"
                      >
                        {isSpeechPlaying ? (
                          <VolumeX className="w-3.5 h-3.5 text-[#C46868]" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() => handleCopy(record.quote)}
                        className={`p-1.5 rounded-md transition-colors ${
                          isCopied ? 'text-emerald-400 bg-emerald-500/20' : 'hover:bg-inherit/10 opacity-70'
                        }`}
                        title="نسخ الشذرة"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      {/* Permanent Lifetime Save Button */}
                      <button
                        onClick={() => handleTogglePermanent(record.quote)}
                        className={`p-1.5 rounded-md transition-colors ${
                          savedPermanentMap[record.quote.id]
                            ? 'text-emerald-400 bg-emerald-500/20'
                            : 'hover:bg-inherit/10 opacity-70'
                        }`}
                        title={
                          savedPermanentMap[record.quote.id]
                            ? 'محفوظة محلياً مدى الحياة في جهازك (انقر للإلغاء)'
                            : 'حفظ الشذرة محلياً مدى الحياة في جهازك'
                        }
                      >
                        <HardDriveDownload className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          audioManager.playPaperRustle();
                          onToggleFavorite(record.quote.id);
                        }}
                        className={`p-1.5 rounded-md transition-colors ${
                          isFav ? 'text-[#C46868] bg-[#8B3A3A]/20' : 'hover:bg-inherit/10 opacity-70'
                        }`}
                        title="مفضلة"
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        onClick={() => {
                          audioManager.playSingingBowl();
                          onOpenCardStudio(record.quote);
                          onClose();
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-amiri font-bold transition-colors ${
                          theme === 'dark'
                            ? 'bg-[#8B3A3A] hover:bg-[#9E4242] text-white'
                            : 'bg-[#7A3838] hover:bg-[#8E4343] text-white'
                        }`}
                      >
                        <Share2 className="w-3 h-3" />
                        <span>تصميم بطاقة</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-inherit/20 text-center text-xs opacity-60 font-sans-ui shrink-0">
          يتم الحفظ التلقائي لكافة الشذرات اليومية في ذاكرة التخزين المحلية لمتصفحك دون انقطاع.
        </div>
      </div>
    </div>
  );
};
