import React, { useState } from 'react';
import { Quote } from '../types';
import {
  Bell,
  Sparkles,
  Share2,
  Volume2,
  VolumeX,
  Bookmark,
  Copy,
  Check,
  RotateCw,
  Calendar,
  Cpu,
  Database,
  HardDriveDownload,
  BookmarkCheck,
} from 'lucide-react';
import { audioManager } from '../utils/sound';
import { sendLocalQuoteNotification, requestNotificationPermission } from '../utils/notifications';
import { cleanQuoteText } from '../utils/dailyQuoteManager';
import { isQuotePermanentlySaved, togglePermanentlySavedQuote } from '../utils/storage';

interface DailyReflectionCardProps {
  quote: Quote;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onOpenCardStudio: (quote: Quote) => void;
  theme: 'dark' | 'sepia';
  onRegenerateDaily?: () => void;
  isRefreshingDaily?: boolean;
  onOpenArchive?: () => void;
  historyCount?: number;
  onOpenNotificationSettings?: () => void;
}

export const DailyReflectionCard: React.FC<DailyReflectionCardProps> = ({
  quote,
  isFavorite,
  onToggleFavorite,
  onOpenCardStudio,
  theme,
  onRegenerateDaily,
  isRefreshingDaily = false,
  onOpenArchive,
  historyCount = 0,
  onOpenNotificationSettings,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [notificationSent, setNotificationSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPermanentlySaved, setIsPermanentlySaved] = useState(() =>
    isQuotePermanentlySaved(quote.id, quote.textAr)
  );
  const [justSavedNotification, setJustSavedNotification] = useState(false);

  React.useEffect(() => {
    setIsPermanentlySaved(isQuotePermanentlySaved(quote.id, quote.textAr));
  }, [quote.id, quote.textAr]);

  const handleTogglePermanentSave = () => {
    audioManager.playSingingBowl();
    const result = togglePermanentlySavedQuote({
      ...quote,
      textAr: cleanedTextAr,
      reflection: cleanedReflection,
    });
    setIsPermanentlySaved(result.isSaved);
    if (result.isSaved) {
      setJustSavedNotification(true);
      setTimeout(() => setJustSavedNotification(false), 3000);
    }
  };

  // Today's formatted Arabic date
  const now = new Date();
  const arabicDate = now.toLocaleDateString('ar-EG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const cleanedTextAr = cleanQuoteText(quote.textAr);
  const cleanedReflection = cleanQuoteText(quote.reflection || '');

  const handleCopy = async () => {
    try {
      const shareText = `« ${cleanedTextAr} »\n\n— ${quote.source} (${quote.chapter})\nأوسامو دازاي · 太宰治`;
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      audioManager.playPaperRustle();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleNotifyMe = async () => {
    audioManager.playPaperRustle();
    if (onOpenNotificationSettings) {
      onOpenNotificationSettings();
      return;
    }
    const hasPerm = await requestNotificationPermission();
    if (hasPerm) {
      sendLocalQuoteNotification({
        ...quote,
        textAr: cleanedTextAr,
        reflection: cleanedReflection,
      });
      setNotificationSent(true);
      setTimeout(() => setNotificationSent(false), 3000);
    }
  };

  const handleSpeech = () => {
    if (!('speechSynthesis' in window)) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanedTextAr);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.85;
    utterance.pitch = 0.95;

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  const isAiQuote = quote.isAiGenerated || quote.dailyDate || quote.tags?.includes('توليد ذكي');

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-6 sm:p-7 border shadow-lg transition-all duration-300 ${
        theme === 'dark'
          ? 'bg-gradient-to-b from-[#202025] to-[#151518] border-[#363642] text-[#E2D9C8]'
          : 'bg-gradient-to-b from-[#FFFDF9] to-[#F3E8D7] border-[#DECDB7] text-[#2C241D]'
      }`}
    >
      {/* Decorative Ink Wash Background Ring */}
      <div
        className={`absolute -top-14 -left-14 w-44 h-44 rounded-full pointer-events-none blur-3xl ${
          theme === 'dark' ? 'bg-[#8B3A3A]/20' : 'bg-[#7A3838]/15'
        }`}
      />
      <div
        className={`absolute -bottom-14 -right-14 w-44 h-44 rounded-full pointer-events-none blur-3xl ${
          theme === 'dark' ? 'bg-[#2C3E35]/30' : 'bg-[#2C3E35]/15'
        }`}
      />

      {/* Header Banner */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5 pb-4 mb-4 border-b border-inherit/20">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`flex items-center gap-1.5 text-xs font-amiri font-bold px-2.5 py-1 rounded-full border ${
              theme === 'dark'
                ? 'bg-[#8B3A3A]/20 border-[#8B3A3A]/40 text-[#E89292]'
                : 'bg-[#7A3838]/15 border-[#7A3838]/30 text-[#7A3838]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C46868]" />
            <span>شذرة اليوم الذكية · 今日の一言</span>
          </span>

          <span className="text-xs opacity-60 font-sans-ui">
            {arabicDate}
          </span>

          {isAiQuote && (
            <span className="inline-flex items-center gap-1 text-[10px] font-sans-ui bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-full">
              <Database className="w-2.5 h-2.5" />
              <span>توليد تلقائي ومحفوظ محلياً</span>
            </span>
          )}
        </div>

        {/* Action controls in header */}
        <div className="flex items-center gap-1.5">
          {/* Regenerate Today's Quote Button with rotating book topics */}
          {onRegenerateDaily && (
            <button
              onClick={() => {
                audioManager.playPaperRustle();
                onRegenerateDaily();
              }}
              disabled={isRefreshingDaily}
              className={`text-xs flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all border ${
                isRefreshingDaily
                  ? 'opacity-50 cursor-wait'
                  : theme === 'dark'
                  ? 'border-[#33333C] hover:bg-[#2A2A33] text-[#C5BAA8]'
                  : 'border-[#DECDB7] hover:bg-[#EBE0D0] text-[#55473B]'
              }`}
              title="توليد شذرة جديدة ومختلفة مستوحاة من أحد كتب أوسامو دازاي وحفظها محلياً"
            >
              <RotateCw className={`w-3.5 h-3.5 text-[#C46868] ${isRefreshingDaily ? 'animate-spin' : ''}`} />
              <span className="font-amiri text-[11px] hidden sm:inline">
                {isRefreshingDaily ? 'جارِ الانتقال لكتاب آخر...' : 'شذرة أخرى من كتبه'}
              </span>
            </button>
          )}

          {/* Past Daily Quotes Archive Trigger */}
          {onOpenArchive && (
            <button
              onClick={() => {
                audioManager.playPaperRustle();
                onOpenArchive();
              }}
              className={`text-xs flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors border ${
                theme === 'dark'
                  ? 'border-[#33333C] hover:bg-[#2A2A33] text-[#C5BAA8]'
                  : 'border-[#DECDB7] hover:bg-[#EBE0D0] text-[#55473B]'
              }`}
              title="عرض سجل شذرات الأيام السابقة المحفوظة"
            >
              <Calendar className="w-3.5 h-3.5 opacity-70" />
              <span className="font-amiri text-[11px]">
                سجل الأيام {historyCount > 0 ? `(${historyCount})` : ''}
              </span>
            </button>
          )}

          {/* Daily Local Notification Trigger */}
          <button
            onClick={handleNotifyMe}
            className={`text-xs flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors border ${
              notificationSent
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : theme === 'dark'
                ? 'border-[#33333C] hover:bg-[#2A2A33] text-[#C5BAA8]'
                : 'border-[#DECDB7] hover:bg-[#EBE0D0] text-[#55473B]'
            }`}
            title="إرسال شذرة اليوم كإشعار محلي صامت"
          >
            <Bell className="w-3.5 h-3.5 text-[#C46868]" />
            <span className="font-amiri text-[11px] hidden sm:inline">
              {notificationSent ? 'تم الإرسال' : 'إشعار'}
            </span>
          </button>
        </div>
      </div>

      {/* Quote Body */}
      <div className="relative z-10 my-3">
        <blockquote className="quote-text text-xl sm:text-2xl font-bold leading-relaxed">
          {cleanedTextAr}
        </blockquote>

        {quote.textJp && (
          <p
            dir="ltr"
            className="mt-3 font-kanji text-xs sm:text-sm tracking-wider opacity-65 select-text"
          >
            {quote.textJp}
          </p>
        )}

        {cleanedReflection && (
          <div
            className={`mt-4 p-3.5 rounded-xl border text-xs sm:text-sm font-amiri leading-relaxed ${
              theme === 'dark'
                ? 'bg-[#121215]/80 border-[#2D2D38] text-[#C5BAA8]'
                : 'bg-[#EFE4D3]/80 border-[#D8C7B0] text-[#4A3D31]'
            }`}
          >
            <span className="font-bold text-[#C46868] ml-1.5">تأمل دازاي:</span>
            {cleanedReflection}
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="relative z-10 mt-5 pt-3 border-t border-inherit/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-amiri font-bold text-sm text-[#C46868]">
            {quote.source}
          </span>
          <span className="opacity-40">·</span>
          <span className="opacity-60 font-sans-ui">{quote.chapter}</span>
          {quote.modelUsed && (
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono opacity-50 bg-inherit/10 px-1.5 py-0.5 rounded">
              <Cpu className="w-2.5 h-2.5" />
              {quote.modelUsed}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Read Voice */}
          <button
            onClick={handleSpeech}
            className={`p-2 rounded-lg transition-colors ${
              isPlaying ? 'bg-[#8B3A3A]/20 text-[#C46868]' : 'hover:bg-inherit/10 opacity-75'
            }`}
            title="الاستماع للشذرة"
          >
            {isPlaying ? (
              <VolumeX className="w-4 h-4 text-[#C46868]" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>

          {/* Copy Quote Button (زر نسخ الشذرة) */}
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-amiri transition-all ${
              copied
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : theme === 'dark'
                ? 'border-[#33333E] hover:bg-[#25252D] text-[#C5BAA8]'
                : 'border-[#D8C7B0] hover:bg-[#EFE4D3] text-[#55473B]'
            }`}
            title="نسخ الشذرة ومصدرها إلى الحافظة"
            aria-label="نسخ الشذرة"
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

          {/* Permanent Lifetime Local Save Button (زر حفظ الشذرة محلياً مدى الحياة) */}
          <button
            onClick={handleTogglePermanentSave}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-amiri transition-all ${
              isPermanentlySaved
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 font-bold shadow-sm'
                : theme === 'dark'
                ? 'border-[#33333E] hover:bg-[#25252D] text-[#C5BAA8] hover:border-emerald-500/50 hover:text-emerald-300'
                : 'border-[#D8C7B0] hover:bg-[#EFE4D3] text-[#55473B] hover:border-emerald-600/50 hover:text-emerald-700'
            }`}
            title={
              isPermanentlySaved
                ? 'محفوظة محلياً مدى الحياة في جهازك (انقر لإلغاء الحفظ)'
                : 'حفظ هذه الشذرة محلياً مدى الحياة في ذاكرة جهازك'
            }
            aria-label="حفظ الشذرة محلياً مدى الحياة"
          >
            <HardDriveDownload
              className={`w-3.5 h-3.5 ${
                isPermanentlySaved ? 'text-emerald-400' : 'text-[#C46868]'
              }`}
            />
            <span className="text-[11px] hidden sm:inline">
              {justSavedNotification
                ? 'تم الحفظ للأبد!'
                : isPermanentlySaved
                ? 'محفوظة محلياً'
                : 'حفظ محلي مدى الحياة'}
            </span>
            <span className="text-[11px] sm:hidden">
              {isPermanentlySaved ? 'محفوظة' : 'حفظ'}
            </span>
          </button>

          {/* Bookmark */}
          <button
            onClick={() => {
              audioManager.playPaperRustle();
              onToggleFavorite(quote.id);
            }}
            className={`p-2 rounded-lg transition-colors ${
              isFavorite ? 'text-[#C46868] bg-[#8B3A3A]/15' : 'hover:bg-inherit/10 opacity-75'
            }`}
            title="حفظ في المفضلة"
          >
            <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          {/* Open in Card Studio */}
          <button
            onClick={() => {
              audioManager.playSingingBowl();
              onOpenCardStudio(quote);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-amiri font-bold shadow-sm transition-all ${
              theme === 'dark'
                ? 'bg-[#8B3A3A] hover:bg-[#9E4242] text-[#FAF6EE] border-[#8B3A3A]'
                : 'bg-[#7A3838] hover:bg-[#8F4242] text-white border-[#7A3838]'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>صنع بطاقة</span>
          </button>
        </div>
      </div>
    </div>
  );
};

