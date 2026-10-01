import React, { useState, useEffect, useMemo } from 'react';
import { Quote, CardExportConfig, CategoryId } from '../types';
import {
  generateQuoteCardBlob,
  shareQuoteCard,
  copyImageToClipboard,
  downloadBlobAsFile,
} from '../utils/canvasExporter';
import { audioManager } from '../utils/sound';
import {
  Share2,
  Download,
  Copy,
  Check,
  Sparkles,
  Palette,
  Maximize2,
  Minimize2,
  Type,
  Stamp,
  AlignRight,
  AlignCenter,
  Dices,
  Search,
  BookOpen,
  Edit3,
  Undo2,
} from 'lucide-react';

interface InteractiveCardStudioProps {
  initialQuote?: Quote | null;
  allQuotes: Quote[];
  theme: 'dark' | 'sepia';
  onCloseModal?: () => void;
  isModal?: boolean;
}

export const InteractiveCardStudio: React.FC<InteractiveCardStudioProps> = ({
  initialQuote,
  allQuotes,
  theme,
  onCloseModal,
  isModal = false,
}) => {
  // Active selected quote
  const [selectedQuote, setSelectedQuote] = useState<Quote>(() => {
    return initialQuote || allQuotes[0];
  });

  // Optional custom text editing for the quote
  const [customText, setCustomText] = useState('');
  const [isEditingText, setIsEditingText] = useState(false);

  // Quote search & selection picker filter
  const [searchQuoteQuery, setSearchQuoteQuery] = useState('');
  const [showQuotePicker, setShowQuotePicker] = useState(false);

  // Card visual configuration
  const [config, setConfig] = useState<CardExportConfig>({
    style: 'dark-ink',
    aspectRatio: 'square',
    showJapanese: true,
    showHankoSeal: true,
    showReflection: false,
    fontSize: 'md',
    textAlign: 'center',
    quoteMarkStyle: 'classic',
    sealPosition: 'center',
  });

  // Preview and export states
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [currentBlob, setCurrentBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  // Synchronize when initialQuote prop changes
  useEffect(() => {
    if (initialQuote) {
      setSelectedQuote(initialQuote);
      setCustomText('');
      setIsEditingText(false);
    }
  }, [initialQuote]);

  // Compute effective quote to render
  const effectiveQuote = useMemo<Quote>(() => {
    if (!customText.trim()) return selectedQuote;
    return {
      ...selectedQuote,
      textAr: customText.trim(),
    };
  }, [selectedQuote, customText]);

  // Generate canvas preview whenever effective quote or config changes
  useEffect(() => {
    let isCancelled = false;
    setIsGenerating(true);

    const timer = setTimeout(async () => {
      const blob = await generateQuoteCardBlob(effectiveQuote, config);
      if (isCancelled) return;

      if (blob) {
        if (previewBlobUrl) {
          URL.revokeObjectURL(previewBlobUrl);
        }
        const url = URL.createObjectURL(blob);
        setPreviewBlobUrl(url);
        setCurrentBlob(blob);
      }
      setIsGenerating(false);
    }, 120);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [effectiveQuote, config]);

  // Filter quotes for picker
  const filteredQuotes = useMemo(() => {
    if (!searchQuoteQuery.trim()) return allQuotes;
    const q = searchQuoteQuery.toLowerCase();
    return allQuotes.filter(
      (item) =>
        item.textAr.toLowerCase().includes(q) ||
        item.source.toLowerCase().includes(q) ||
        item.textJp.toLowerCase().includes(q)
    );
  }, [allQuotes, searchQuoteQuery]);

  // Pick random quote
  const handleRandomQuote = () => {
    audioManager.playInkDrop();
    const randomIndex = Math.floor(Math.random() * allQuotes.length);
    setSelectedQuote(allQuotes[randomIndex] || allQuotes[0]);
    setCustomText('');
    setIsEditingText(false);
  };

  // Native share handler
  const handleNativeShare = async () => {
    if (!currentBlob) return;
    setIsGenerating(true);
    audioManager.playSingingBowl();

    const res = await shareQuoteCard(effectiveQuote, currentBlob);
    setIsGenerating(false);

    if (res.method === 'native-file') {
      setShareFeedback('تم فتح نافذة المشاركة بالجهاز');
    } else if (res.method === 'native-text') {
      setShareFeedback('تمت مشاركة النص وتنزيل الصورة');
    } else {
      setShareFeedback('تم تنزيل الصورة للمشاركة');
    }

    setTimeout(() => setShareFeedback(null), 3000);
  };

  // Direct PNG Download
  const handleDownload = async () => {
    if (!currentBlob) return;
    audioManager.playSingingBowl();
    await downloadBlobAsFile(
      currentBlob,
      `dazai-card-${effectiveQuote.id}-${config.aspectRatio}.png`
    );
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  // Copy Image to Clipboard
  const handleCopyImage = async () => {
    if (!currentBlob) return;
    const ok = await copyImageToClipboard(currentBlob);
    if (ok) {
      audioManager.playPaperRustle();
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 2500);
    } else {
      // If the OS blocks image clipboard, save the real PNG file instead.
      await handleDownload();
    }
  };

  // Copy Quote Text
  const handleCopyText = () => {
    const text = `« ${effectiveQuote.textAr} »\n\n${effectiveQuote.textJp}\n\n— ${effectiveQuote.source} (${effectiveQuote.chapter})\nأوسامو دازاي · 太宰 治`;
    navigator.clipboard.writeText(text);
    audioManager.playPaperRustle();
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="space-y-6 animate-ink">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-inherit/20">
        <div>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-[#C46868]" />
            <h2 className="font-amiri text-2xl font-bold">
              صانع بطاقات الاقتباس الأدبية
            </h2>
          </div>
          <p className="text-xs opacity-60 font-kanji mt-0.5">
            太宰治の断片カード作成スタジオ · Melancholic Card Studio
          </p>
        </div>

        {/* Quick actions in header */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowQuotePicker(!showQuotePicker)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-amiri font-bold transition-all ${
              showQuotePicker
                ? theme === 'dark'
                  ? 'bg-[#8B3A3A] text-white border-[#8B3A3A]'
                  : 'bg-[#7A3838] text-white border-[#7A3838]'
                : theme === 'dark'
                ? 'bg-[#22222A] hover:bg-[#2C2C35] border-[#363644] text-[#E2D9C8]'
                : 'bg-[#EAE0D0] hover:bg-[#E0D4C2] border-[#D0C1AD] text-[#33251A]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{showQuotePicker ? 'إغلاق القائمة' : 'اختيار شذرة أخرى'}</span>
          </button>

          <button
            onClick={handleRandomQuote}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-amiri transition-all ${
              theme === 'dark'
                ? 'hover:bg-[#252530] border-[#363644] text-[#C5BAA8]'
                : 'hover:bg-[#EAE0D0] border-[#D0C1AD] text-[#55473B]'
            }`}
            title="اختيار شذرة عشوائية"
          >
            <Dices className="w-3.5 h-3.5 text-[#C46868]" />
            <span>عشوائي</span>
          </button>
        </div>
      </div>

      {/* Quote Selector Drawer / Overlay */}
      {showQuotePicker && (
        <div
          className={`p-4 rounded-2xl border space-y-3 animate-ink transition-colors ${
            theme === 'dark'
              ? 'bg-[#18181D] border-[#2E2E3C]'
              : 'bg-[#FAF4EB] border-[#DECDB7]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-amiri font-bold opacity-80">
              اختر الشذرة المراد تصميم بطاقتها ({filteredQuotes.length}):
            </span>
            <span className="text-[11px] opacity-60 font-sans-ui">
              المصدر: {selectedQuote.source}
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-2.5 opacity-50" />
            <input
              type="text"
              value={searchQuoteQuery}
              onChange={(e) => setSearchQuoteQuery(e.target.value)}
              placeholder="ابحث في نصوص الشذرات أو الروايات..."
              className="w-full text-xs font-amiri pr-9 pl-3 py-2 rounded-xl border border-inherit/20 bg-black/10 outline-none focus:border-[#C46868]"
            />
          </div>

          <div className="max-h-56 overflow-y-auto space-y-2 pr-1 no-scrollbar">
            {filteredQuotes.map((q) => {
              const isSelected = q.id === selectedQuote.id;
              return (
                <div
                  key={q.id}
                  onClick={() => {
                    audioManager.playPaperRustle();
                    setSelectedQuote(q);
                    setCustomText('');
                    setIsEditingText(false);
                    setShowQuotePicker(false);
                  }}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? theme === 'dark'
                        ? 'bg-[#8B3A3A]/20 border-[#C46868] text-[#FAF6EE]'
                        : 'bg-[#7A3838]/15 border-[#7A3838] text-[#7A3838]'
                      : 'border-inherit/20 opacity-75 hover:opacity-100 hover:bg-inherit/10'
                  }`}
                >
                  <div className="flex items-center justify-between font-amiri text-[11px] text-[#C46868] font-bold mb-1">
                    <span>{q.source}</span>
                    <span className="opacity-60">{q.chapter}</span>
                  </div>
                  <div className="font-amiri line-clamp-2 leading-relaxed">
                    {q.textAr}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Studio Grid: Left Controls, Right Live Card Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card Live Canvas Preview (Column 1-7) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center">
          <div
            className={`w-full p-4 sm:p-6 rounded-2xl border flex flex-col items-center justify-center min-h-[360px] relative transition-colors ${
              theme === 'dark'
                ? 'bg-[#121215] border-[#262630]'
                : 'bg-[#F2E8D8] border-[#DFD0BC]'
            }`}
          >
            {isGenerating && !previewBlobUrl ? (
              <div className="flex flex-col items-center gap-2 text-xs opacity-60">
                <Sparkles className="w-6 h-6 animate-spin text-[#C46868]" />
                <span className="font-amiri">جاري تحضير بطاقة الحبر...</span>
              </div>
            ) : previewBlobUrl ? (
              <div className="relative group max-w-full flex items-center justify-center">
                <img
                  src={previewBlobUrl}
                  alt="بطاقة الاقتباس الأدبية"
                  className={`object-contain rounded-xl shadow-2xl border border-white/10 transition-transform ${
                    config.aspectRatio === 'story'
                      ? 'max-h-[500px]'
                      : config.aspectRatio === 'landscape'
                      ? 'max-h-[380px] w-full'
                      : 'max-h-[440px]'
                  }`}
                />
                {isGenerating && (
                  <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 animate-spin text-white" />
                  </div>
                )}
              </div>
            ) : null}

            {/* Subtle caption */}
            <div className="mt-3 flex items-center gap-2 text-[11px] opacity-60 font-sans-ui">
              <span>دقة الصورة: عالية (2K Retina Ultra HD)</span>
              <span>·</span>
              <span>الأبعاد الحالية: {config.aspectRatio.toUpperCase()}</span>
            </div>
          </div>

          {/* Quick Primary Export Row beneath Preview */}
          <div className="w-full mt-4 flex flex-wrap items-center justify-between gap-2.5">
            {/* Native Share (Expo-sharing style) */}
            <button
              onClick={handleNativeShare}
              disabled={isGenerating}
              className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-amiri font-bold shadow-md transition-all ${
                theme === 'dark'
                  ? 'bg-[#8B3A3A] hover:bg-[#9F4242] text-[#FAF6EE]'
                  : 'bg-[#7A3838] hover:bg-[#8F4343] text-white'
              }`}
              title="مشاركة الصورة مباشرة إلى تطبيقات التواصل"
            >
              <Share2 className="w-4 h-4" />
              <span>مشاركة بالجهاز (Native Share)</span>
            </button>

            {/* Direct PNG Download */}
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-xs font-amiri font-bold transition-all ${
                downloadSuccess
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : theme === 'dark'
                  ? 'bg-[#22222A] hover:bg-[#2C2C35] border-[#363644] text-[#FAF6EE]'
                  : 'bg-[#FAF4EB] hover:bg-[#EDE2D2] border-[#DECDB7] text-[#2C241D]'
              }`}
            >
              {downloadSuccess ? (
                <Check className="w-4 h-4" />
              ) : (
                <Download className="w-4 h-4 text-[#C46868]" />
              )}
              <span>{downloadSuccess ? 'تم الحفظ بنجاح' : 'تنزيل PNG (2K)'}</span>
            </button>

            {/* Copy to Clipboard */}
            <button
              onClick={handleCopyImage}
              disabled={isGenerating}
              className={`flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl border text-xs font-amiri font-bold transition-colors ${
                copiedImage
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : theme === 'dark'
                  ? 'bg-[#22222A] hover:bg-[#2C2C35] border-[#363644] text-[#C5BAA8]'
                  : 'bg-[#FAF4EB] hover:bg-[#EDE2D2] border-[#DECDB7] text-[#55473B]'
              }`}
              title="نسخ الصورة مباشرة إلى الحافظة"
            >
              {copiedImage ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>تم نسخ الصورة</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>نسخ الصورة</span>
                </>
              )}
            </button>
          </div>

          {/* Feedback badge */}
          {shareFeedback && (
            <div className="mt-2 text-xs font-amiri text-[#C46868] animate-ink">
              {shareFeedback}
            </div>
          )}
        </div>

        {/* Customization Controls (Column 8-12) */}
        <div className="lg:col-span-5 space-y-4">
          {/* 1. Theme Style Palette */}
          <div
            className={`p-4 rounded-2xl border transition-colors ${
              theme === 'dark'
                ? 'bg-[#18181C] border-[#2C2C36]'
                : 'bg-[#FAF4EB] border-[#DECDB7]'
            }`}
          >
            <label className="text-xs font-amiri font-bold opacity-80 block mb-2.5">
              طابع الحبر والورق (Melancholic Style):
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  id: 'dark-ink',
                  name: 'حبر داكن كلاسيكي',
                  sub: 'عتمة الشوا وقرمزية الغروب',
                  bg: 'bg-[#161619] border-[#363640] text-white',
                },
                {
                  id: 'parchment',
                  name: 'ورق شوا عتيق',
                  sub: 'صفحات معتقة وحبر سومي',
                  bg: 'bg-[#EAE0D0] border-[#D0C1AD] text-[#2C2018]',
                },
                {
                  id: 'forest-night',
                  name: 'غسق كاناغاوا',
                  sub: 'صنوبر وضباب المساء',
                  bg: 'bg-[#14201A] border-[#283830] text-[#D0E2D6]',
                },
                {
                  id: 'monochrome',
                  name: 'العزلة والعدم',
                  sub: 'سواد حالك وبياض حاد',
                  bg: 'bg-[#0E0E10] border-[#2A2A2E] text-[#ECE7DF]',
                },
              ].map((styleOpt) => (
                <button
                  key={styleOpt.id}
                  onClick={() => {
                    audioManager.playPaperRustle();
                    setConfig({ ...config, style: styleOpt.id as any });
                  }}
                  className={`p-2.5 rounded-xl border text-right transition-all ${
                    config.style === styleOpt.id
                      ? 'ring-2 ring-[#C46868] shadow-md scale-[1.01]'
                      : 'opacity-70 hover:opacity-100'
                  } ${styleOpt.bg}`}
                >
                  <div className="font-amiri font-bold text-xs">
                    {styleOpt.name}
                  </div>
                  <div className="text-[10px] opacity-65 font-sans-ui mt-0.5">
                    {styleOpt.sub}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Aspect Ratio */}
          <div
            className={`p-4 rounded-2xl border transition-colors ${
              theme === 'dark'
                ? 'bg-[#18181C] border-[#2C2C36]'
                : 'bg-[#FAF4EB] border-[#DECDB7]'
            }`}
          >
            <label className="text-xs font-amiri font-bold opacity-80 block mb-2">
              أبعاد البطاقة (Aspect Ratio):
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'square', label: 'مربع (1:1)', note: 'منشور إنستغرام' },
                { id: 'story', label: 'طولي (9:16)', note: 'ستوري / خلفية جوال' },
                { id: 'landscape', label: 'أفقي (3:2)', note: 'تغريدة / بطاقة مقال' },
              ].map((aspect) => (
                <button
                  key={aspect.id}
                  onClick={() => {
                    audioManager.playPaperRustle();
                    setConfig({ ...config, aspectRatio: aspect.id as any });
                  }}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    config.aspectRatio === aspect.id
                      ? theme === 'dark'
                        ? 'bg-[#8B3A3A]/25 border-[#C46868] text-[#FAF6EE] shadow-sm'
                        : 'bg-[#7A3838]/15 border-[#7A3838] text-[#7A3838] shadow-sm'
                      : 'border-inherit/20 opacity-65 hover:opacity-100'
                  }`}
                >
                  <div className="font-amiri font-bold text-xs">{aspect.label}</div>
                  <div className="text-[10px] opacity-60 font-sans-ui">{aspect.note}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Typography & Formatting Elements */}
          <div
            className={`p-4 rounded-2xl border space-y-3 transition-colors ${
              theme === 'dark'
                ? 'bg-[#18181C] border-[#2C2C36]'
                : 'bg-[#FAF4EB] border-[#DECDB7]'
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="text-xs font-amiri font-bold opacity-80">
                خيارات الخط والمحاذاة:
              </label>

              {/* Text Alignment */}
              <div className="flex items-center gap-1 border border-inherit/20 rounded-lg p-0.5">
                <button
                  onClick={() => {
                    audioManager.playPaperRustle();
                    setConfig({ ...config, textAlign: 'center' });
                  }}
                  className={`p-1 rounded ${
                    config.textAlign !== 'right'
                      ? 'bg-[#8B3A3A] text-white'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  title="توسيط شعري متزن"
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    audioManager.playPaperRustle();
                    setConfig({ ...config, textAlign: 'right' });
                  }}
                  className={`p-1 rounded ${
                    config.textAlign === 'right'
                      ? 'bg-[#8B3A3A] text-white'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  title="محاذاة أدبية لليمين"
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Font Size Buttons */}
            <div className="grid grid-cols-3 gap-2">
              {(['sm', 'md', 'lg'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    audioManager.playPaperRustle();
                    setConfig({ ...config, fontSize: size });
                  }}
                  className={`py-1.5 rounded-lg border text-xs font-amiri font-bold transition-all ${
                    config.fontSize === size
                      ? theme === 'dark'
                        ? 'bg-[#8B3A3A] border-[#8B3A3A] text-white'
                        : 'bg-[#7A3838] border-[#7A3838] text-white'
                      : 'border-inherit/20 opacity-65 hover:opacity-100'
                  }`}
                >
                  {size === 'sm' ? 'خط مدمج (ص)' : size === 'md' ? 'خط متزن (م)' : 'خط كبير (ك)'}
                </button>
              ))}
            </div>

            {/* Quote Mark Style Selector */}
            <div>
              <label className="text-[11px] font-amiri opacity-75 block mb-1">
                نمط علامات الاقتباس:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'classic', label: 'كلاسيكي “ ”' },
                  { id: 'brackets', label: 'كانجي 「 断片 」' },
                  { id: 'none', label: 'بسيط بدون علامات' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      audioManager.playPaperRustle();
                      setConfig({ ...config, quoteMarkStyle: opt.id as any });
                    }}
                    className={`py-1 px-1.5 rounded-lg border text-[11px] font-amiri transition-all ${
                      (config.quoteMarkStyle || 'classic') === opt.id
                        ? theme === 'dark'
                          ? 'bg-[#8B3A3A]/20 border-[#C46868] text-[#FAF6EE]'
                          : 'bg-[#7A3838]/15 border-[#7A3838] text-[#7A3838]'
                        : 'border-inherit/20 opacity-65'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Artistic Elements Toggles */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-inherit/15">
              {/* Show Japanese */}
              <button
                onClick={() => {
                  audioManager.playPaperRustle();
                  setConfig({ ...config, showJapanese: !config.showJapanese });
                }}
                className={`p-2 rounded-lg border text-xs flex items-center justify-between font-amiri ${
                  config.showJapanese
                    ? theme === 'dark'
                      ? 'bg-[#25252E] border-[#8B3A3A] text-[#FAF6EE]'
                      : 'bg-[#EDE2D2] border-[#7A3838] text-[#7A3838]'
                    : 'border-inherit/20 opacity-60'
                }`}
              >
                <span>الكانجي الياباني</span>
                {config.showJapanese && (
                  <Check className="w-3.5 h-3.5 text-[#C46868]" />
                )}
              </button>

              {/* Show Hanko Stamp */}
              <button
                onClick={() => {
                  audioManager.playPaperRustle();
                  setConfig({ ...config, showHankoSeal: !config.showHankoSeal });
                }}
                className={`p-2 rounded-lg border text-xs flex items-center justify-between font-amiri ${
                  config.showHankoSeal
                    ? theme === 'dark'
                      ? 'bg-[#25252E] border-[#8B3A3A] text-[#FAF6EE]'
                      : 'bg-[#EDE2D2] border-[#7A3838] text-[#7A3838]'
                    : 'border-inherit/20 opacity-60'
                }`}
              >
                <span>ختم دازاي الأحمر (太宰治)</span>
                {config.showHankoSeal && (
                  <Check className="w-3.5 h-3.5 text-[#C46868]" />
                )}
              </button>

              {/* Show Reflection */}
              <button
                onClick={() => {
                  audioManager.playPaperRustle();
                  setConfig({ ...config, showReflection: !config.showReflection });
                }}
                className={`p-2 rounded-lg border text-xs flex items-center justify-between font-amiri col-span-2 ${
                  config.showReflection
                    ? theme === 'dark'
                      ? 'bg-[#25252E] border-[#8B3A3A] text-[#FAF6EE]'
                      : 'bg-[#EDE2D2] border-[#7A3838] text-[#7A3838]'
                    : 'border-inherit/20 opacity-60'
                }`}
              >
                <span>تضمين الشذرة التأملية التحليلية</span>
                {config.showReflection && (
                  <Check className="w-3.5 h-3.5 text-[#C46868]" />
                )}
              </button>
            </div>
          </div>

          {/* 4. Edit Quote Text / Custom Inspiration */}
          <div
            className={`p-4 rounded-2xl border transition-colors ${
              theme === 'dark'
                ? 'bg-[#18181C] border-[#2C2C36]'
                : 'bg-[#FAF4EB] border-[#DECDB7]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-amiri font-bold opacity-80 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-[#C46868]" />
                <span>تعديل نص الشذرة على البطاقة (اختياري):</span>
              </label>

              {customText && (
                <button
                  onClick={() => setCustomText('')}
                  className="text-[11px] font-amiri text-[#C46868] flex items-center gap-1 hover:underline"
                >
                  <Undo2 className="w-3 h-3" />
                  <span>استعادة الأصل</span>
                </button>
              )}
            </div>

            <textarea
              rows={2}
              value={customText || selectedQuote.textAr}
              onChange={(e) => setCustomText(e.target.value)}
              className="w-full text-xs font-amiri leading-relaxed p-2.5 rounded-xl border border-inherit/20 bg-black/10 outline-none focus:border-[#C46868] resize-none"
              placeholder="اكتب أو عدل النص ليظهر في البطاقة..."
            />
          </div>

          {/* Secondary Actions: Copy Text */}
          <div className="flex items-center justify-between text-xs pt-1 px-1">
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 opacity-70 hover:opacity-100 font-amiri transition-opacity"
            >
              {copiedText ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedText ? 'تم نسخ النص الكامل' : 'نسخ النص الأدبي فقط'}</span>
            </button>

            <span className="opacity-50 text-[11px] font-sans-ui">
              {selectedQuote.year} · {selectedQuote.source}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
