import React, { useState, useEffect } from 'react';
import {
  AIProviderConfig,
  AIProvider,
  ProviderTestResult,
  AppLanguage,
} from '../types';
import {
  Cpu,
  Key,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  EyeOff,
  Bell,
  Bookmark,
  ShieldCheck,
  Save,
  Trash2,
  RefreshCw,
  Activity,
  AlertTriangle,
  Zap,
  Sparkles,
  Check,
  Languages,
  Globe,
} from 'lucide-react';
import { audioManager } from '../utils/sound';
import { useLanguage } from '../i18n/LanguageContext';
import {
  saveAIConfig,
  clearAIKeys,
  getLastTestResult,
  saveLastTestResult,
  getNotificationSettings,
  saveNotificationSettings,
  NotificationSettings,
  getDailyQuote,
  getProviderStatuses,
  saveProviderStatus,
  ProviderStatusMap,
} from '../utils/storage';
import { validateProvider, detectProviderFromKey, discoverAvailableModels } from '../utils/ai';
import {
  isAutoDailyQuoteEnabled,
  setAutoDailyQuoteEnabled,
  getDailyQuotesHistory,
} from '../utils/dailyQuoteManager';
import {
  requestNotificationPermission,
  sendLocalQuoteNotification,
} from '../utils/notifications';

interface AIProviderSettingsProps {
  config: AIProviderConfig;
  onChangeConfig: (config: AIProviderConfig) => void;
  theme: 'dark' | 'sepia';
  favoritesCount: number;
  onViewFavorites: () => void;
  onOpenDailyArchive?: () => void;
}

export const AIProviderSettings: React.FC<AIProviderSettingsProps> = ({
  config,
  onChangeConfig,
  theme,
  favoritesCount,
  onViewFavorites,
  onOpenDailyArchive,
}) => {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testResult, setTestResult] = useState<ProviderTestResult>(() => getLastTestResult());
  const [providerStatuses, setProviderStatuses] = useState<ProviderStatusMap>(() =>
    getProviderStatuses()
  );
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<Record<string, string[]>>({});
  const [modelsChecking, setModelsChecking] = useState(false);
  const [autoDailyEnabled, setAutoDailyEnabled] = useState<boolean>(() => isAutoDailyQuoteEnabled());
  const [dailyHistoryCount, setDailyHistoryCount] = useState<number>(() => getDailyQuotesHistory().length);
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>(() => getNotificationSettings());
  const [savedBadge, setSavedBadge] = useState(false);
  const [localSaveNotice, setLocalSaveNotice] = useState<string | null>(null);
  const [smartPasteInput, setSmartPasteInput] = useState('');
  const [smartPasteDetected, setSmartPasteDetected] = useState<string | null>(null);

  const { language, setLanguage, t } = useLanguage();

  // Auto-migrate any deprecated model stored in config
  useEffect(() => {
    if (
      config.provider === 'gemini' &&
      (!config.selectedModel ||
        config.selectedModel.includes('2.5') ||
        config.selectedModel.includes('2.0') ||
        config.selectedModel.includes('1.5'))
    ) {
      handleUpdate({ selectedModel: 'gemini-3.8-flash' });
    }

    if (
      config.provider === 'groq' &&
      (!config.selectedModel ||
        config.selectedModel.includes('llama-3') ||
        config.selectedModel.includes('mixtral') ||
        config.selectedModel === 'default')
    ) {
      handleUpdate({ selectedModel: 'openai/gpt-oss-120b' });
    }

    if (
      config.provider === 'openai' &&
      (!config.selectedModel ||
        config.selectedModel.includes('gpt-3.5') ||
        config.selectedModel === 'default')
    ) {
      handleUpdate({ selectedModel: 'gpt-4o-mini' });
    }

    if (
      config.provider === 'anthropic' &&
      (!config.selectedModel ||
        (!config.selectedModel.startsWith('claude-3-5') &&
          !config.selectedModel.startsWith('claude-3-opus')) ||
        config.selectedModel === 'default')
    ) {
      handleUpdate({ selectedModel: 'claude-3-5-sonnet-20241022' });
    }
  }, [config.selectedModel, config.provider]);

  const toggleShowKey = (id: string) => {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleUpdate = (updates: Partial<AIProviderConfig>) => {
    const updated = { ...config, ...updates };
    onChangeConfig(updated);
    saveAIConfig(updated);
    setSavedBadge(true);
    setTimeout(() => setSavedBadge(false), 2000);
    return updated;
  };

  // Smart Paste Handler: paste ANY key here, and it configures everything automatically!
  const handleSmartPaste = (rawKey: string) => {
    setSmartPasteInput(rawKey);
    const trimmed = rawKey.trim();
    if (!trimmed) {
      setSmartPasteDetected(null);
      return;
    }

    const detected = detectProviderFromKey(trimmed);
    if (detected) {
      setSmartPasteDetected(`تم التعرّف: ${detected.name}`);
      audioManager.playSingingBowl();

      const updates: Partial<AIProviderConfig> = {
        provider: detected.provider,
        selectedModel: detected.recommendedModel,
        [detected.keyField]: trimmed,
      };

      if (detected.provider === 'groq') {
        updates.groqKey = trimmed;
        updates.customKey = trimmed;
      }

      const nextConfig = handleUpdate(updates);
      setLocalSaveNotice(
        `✨ تم التعرف التلقائي على مفتاح ${detected.name}! تم ضبط المزود والنموذج (${detected.recommendedModel}) وحفظه بنجاح.`
      );
      setTimeout(() => setLocalSaveNotice(null), 5000);

      // Trigger automatic ping test immediately
      handleTestSpecificProvider(detected.provider, undefined, nextConfig);
    } else {
      setSmartPasteDetected(null);
    }
  };

  // Key change in active tab with intelligent cross-provider detection
  const handleKeyChange = (val: string) => {
    const trimmed = val.trim();
    const detected = detectProviderFromKey(trimmed);

    // If the user pasted a key for another provider into this box, switch seamlessly!
    if (detected && detected.provider !== config.provider) {
      audioManager.playSingingBowl();
      const updates: Partial<AIProviderConfig> = {
        provider: detected.provider,
        selectedModel: detected.recommendedModel,
        [detected.keyField]: trimmed,
      };
      if (detected.provider === 'groq') {
        updates.groqKey = trimmed;
        updates.customKey = trimmed;
      }
      const nextConfig = handleUpdate(updates);
      setLocalSaveNotice(
        `✨ تم التعرّف على مفتاح ${detected.name}! تم تحويل المزود تلقائياً وضبط النموذج (${detected.recommendedModel})`
      );
      setTimeout(() => setLocalSaveNotice(null), 5000);
      handleTestSpecificProvider(detected.provider, undefined, nextConfig);
      return;
    }

    if (config.provider === 'gemini') handleUpdate({ geminiKey: val });
    else if (config.provider === 'openai') handleUpdate({ openAiKey: val });
    else if (config.provider === 'anthropic') handleUpdate({ anthropicKey: val });
    else if (config.provider === 'groq') handleUpdate({ groqKey: val, customKey: val });
    else handleUpdate({ customKey: val });
  };

  // Explicit Save to LocalStorage confirmation
  const handleExplicitSaveLocal = () => {
    audioManager.playSingingBowl();
    saveAIConfig(config);
    setLocalSaveNotice('تم حفظ كافة مفاتيح الـ API والإعدادات محلياً في متصفحك (LocalStorage) بنجاح ✓');
    setTimeout(() => setLocalSaveNotice(null), 4000);
  };

  // Clear local keys
  const handleClearKeys = () => {
    if (window.confirm('هل تريد بالتأكيد مسح كافة مفاتيح API المخزنة محلياً في هذا المتصفح؟')) {
      audioManager.playPaperRustle();
      const reset = clearAIKeys();
      onChangeConfig(reset);
      const emptyResult: ProviderTestResult = {
        testedAt: Date.now(),
        status: 'idle',
        message: 'تم مسح المفاتيح المحلية. يمكنك إدخال مفتاح جديد أو استخدام المزود الافتراضي.',
      };
      setTestResult(emptyResult);
      saveLastTestResult(emptyResult);
      setProviderStatuses({});
      setLocalSaveNotice('تم مسح المفاتيح المخزنة محلياً بنجاح.');
      setTimeout(() => setLocalSaveNotice(null), 3000);
    }
  };

  // Validate a specific provider (Ping) using validateProvider from src/utils/ai.ts
  const handleTestSpecificProvider = async (
    targetProvider: AIProvider,
    e?: React.MouseEvent,
    configOverride?: AIProviderConfig
  ) => {
    if (e) {
      e.stopPropagation(); // prevent switching active tab if clicking the test button inside tab
    }
    audioManager.playInkDrop();
    setTestingProvider(targetProvider);

    const activeConfig = configOverride || config;

    // Update status to testing
    const testingEntry = {
      status: 'testing' as const,
      testedAt: Date.now(),
      message: `جاري إرسال طلب فحص خفيف (Ping) للمزود (${targetProvider})...`,
    };
    setProviderStatuses((prev) => ({
      ...prev,
      [targetProvider]: testingEntry,
    }));

    if (targetProvider === activeConfig.provider) {
      setTestResult({
        status: 'testing',
        testedAt: Date.now(),
        message: `جاري فحص الاتصال بالمزود (${targetProvider})...`,
        provider: targetProvider,
      });
    }

    try {
      const keyForProvider = targetProvider === 'gemini' ? activeConfig.geminiKey : targetProvider === 'openai' ? activeConfig.openAiKey : targetProvider === 'anthropic' ? activeConfig.anthropicKey : targetProvider === 'groq' ? (activeConfig.groqKey || activeConfig.customKey) : activeConfig.customKey;
      setModelsChecking(true);
      const discovered = await discoverAvailableModels(targetProvider, keyForProvider || '', targetProvider === 'custom' ? activeConfig.customBaseUrl : undefined);
      if (discovered.length) {
        setAvailableModels((prev) => ({ ...prev, [targetProvider]: discovered }));
        if (!discovered.includes(activeConfig.selectedModel)) {
          const nextConfig = { ...activeConfig, selectedModel: discovered[0] };
          onChangeConfig(nextConfig);
          saveAIConfig(nextConfig);
        }
      }
      const result = await validateProvider({ ...activeConfig, selectedModel: discovered[0] || activeConfig.selectedModel }, targetProvider);

      const statusEntry = {
        status: result.status,
        testedAt: result.testedAt,
        message: result.message,
        latencyMs: result.latencyMs,
      };

      setProviderStatuses((prev) => ({
        ...prev,
        [targetProvider]: statusEntry,
      }));
      saveProviderStatus(targetProvider, statusEntry);

      if (targetProvider === activeConfig.provider) {
        setTestResult(result);
        saveLastTestResult(result);
      }

      if (result.success) {
        audioManager.playSingingBowl();
      }
    } catch (err: any) {
      const errorEntry = {
        status: 'error' as const,
        testedAt: Date.now(),
        message: err.message || `فشل الاتصال بالمزود (${targetProvider}).`,
      };
      setProviderStatuses((prev) => ({
        ...prev,
        [targetProvider]: errorEntry,
      }));
      saveProviderStatus(targetProvider, errorEntry);

      if (targetProvider === activeConfig.provider) {
        const errorResult: ProviderTestResult = {
          testedAt: Date.now(),
          status: 'error',
          message: err.message || `فشل الاتصال بالمزود (${targetProvider}).`,
          provider: targetProvider,
        };
        setTestResult(errorResult);
        saveLastTestResult(errorResult);
      }
    } finally {
      setModelsChecking(false);
      setTestingProvider(null);
    }
  };

  const handleTestConnection = async () => {
    await handleTestSpecificProvider(config.provider);
  };

  const handleToggleNotification = async () => {
    const nextEnabled = !notificationSettings.enabled;
    if (nextEnabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        alert('يرجى منح إذن الإشعارات في المتصفح لتفعيل اقتباس اليوم.');
        return;
      }
    }
    const updated = { ...notificationSettings, enabled: nextEnabled };
    setNotificationSettings(updated);
    saveNotificationSettings(updated);
    audioManager.playPaperRustle();
  };

  const handleTestNotification = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      const quote = getDailyQuote();
      sendLocalQuoteNotification(quote);
    } else {
      alert('إذن الإشعارات غير مفعل في متصفحك.');
    }
  };

  interface ProviderModelItem {
    id: string;
    label: string;
    desc: string;
    badge?: string;
    speed: string;
    highlight?: boolean;
  }

  const providerModels: Record<AIProvider, ProviderModelItem[]> = {
    gemini: [
      {
        id: 'gemini-3.8-flash',
        label: 'Gemini 3.8 Flash',
        desc: 'النموذج الأحدث والموصى به من Google — توازن فائق بين الاستيعاب الأدبي وسرعة التوليد.',
        badge: 'موصى به',
        speed: '~140ms',
        highlight: true,
      },
      {
        id: 'gemini-3.1-flash-lite',
        label: 'Gemini 3.1 Flash Lite',
        desc: 'النموذج الأخف وزناً والأسرع استجابة — مثالي للأجهزة والمحادثات الخاطفة.',
        badge: 'خفيف وفائق السرعة',
        speed: '~90ms',
      },
      {
        id: 'gemini-flash-latest',
        label: 'Gemini Flash Latest',
        desc: 'مؤشر مستمر يُوجّه الطلبات تلقائياً لأحدث إصدار مستقر من عائلة Flash.',
        badge: 'تحديث مستمر',
        speed: '~150ms',
      },
    ],
    groq: [
      {
        id: 'openai/gpt-oss-120b',
        label: 'GPT OSS 120B (Groq)',
        desc: 'العملاق 120 مليار معامل على شرائح LPU — عمق أدبي وفلسفي خارق مع سرعة استجابة مذهلة.',
        badge: 'النموذج الأقوى',
        speed: '~220ms',
        highlight: true,
      },
      {
        id: 'allam-2-7b',
        label: 'علام ALLaM 2 7B',
        desc: 'النموذج العربي المتخصص المطور من سدايا (SDAIA) — فصاحة وبلاغة عربية خالصة تحاكي روح دازاي بدقة.',
        badge: 'عربي أصيل (سدايا)',
        speed: '~180ms',
        highlight: true,
      },
      {
        id: 'openai/gpt-oss-20b',
        label: 'GPT OSS 20B',
        desc: 'نموذج خفيف ورشيق مخصص للمحادثات السريعة والاستجابة اللحظية في أجزاء من الثانية.',
        badge: 'فوري ورشيق',
        speed: '~80ms',
      },
      {
        id: 'qwen/qwen3.8-27b',
        label: 'Qwen 3.8 27B',
        desc: 'نموذج متعدد اللغات متفوق في المنطق الفلسفي الآسيوي والتأملات الوجودية الأدبية.',
        badge: 'أدبي وفلسفي',
        speed: '~150ms',
      },
    ],
    openai: [
      {
        id: 'gpt-4o-mini',
        label: 'GPT-4o Mini',
        desc: 'النموذج الذكي الخفيف والاقتصادي من OpenAI — كفاءة بلاغية عالية واستيعاب عميق.',
        badge: 'موصى به',
        speed: '~250ms',
        highlight: true,
      },
      {
        id: 'gpt-4o',
        label: 'GPT-4o (Omni)',
        desc: 'النموذج الرائد الأكثر ذكاءً وشمولية — محاكاة إنسانية بديعة وتوليد أدبي معقد وفلسفي.',
        badge: 'النموذج الرائد',
        speed: '~400ms',
      },
      {
        id: 'o3-mini',
        label: 'o3 Mini',
        desc: 'نموذج التفكير والاستدلال المنطقي المتأني — تحليل فلسفي واستبطان نفسي عميق للذات.',
        badge: 'تفكير واستدلال',
        speed: '~700ms',
      },
      {
        id: 'gpt-4-turbo',
        label: 'GPT-4 Turbo',
        desc: 'الإصدار التوربيني الكلاسيكي عالي الدقة والسياق للأعمال الفكرية المعقدة.',
        badge: 'كلاسيكي قوي',
        speed: '~600ms',
      },
    ],
    anthropic: [
      {
        id: 'claude-3-5-sonnet-20241022',
        label: 'Claude 3.5 Sonnet',
        desc: 'المعيار الذهبي العالمي في الكتابة الإبداعية والنثر الفلسفي — يحاكي روح أوسامو دازاي بأعلى براعة.',
        badge: 'الأفضل أدبياً',
        speed: '~350ms',
        highlight: true,
      },
      {
        id: 'claude-3-5-haiku-20241022',
        label: 'Claude 3.5 Haiku',
        desc: 'أسرع نماذج عائلة كلود وأكثرها رشاقة — نبرة أدبية حية وأنيقة مع سرعة فائقة.',
        badge: 'فائق السرعة',
        speed: '~180ms',
      },
      {
        id: 'claude-3-opus-20240229',
        label: 'Claude 3 Opus',
        desc: 'النموذج الأعمق في التأمل البشري والاستبطان الفلسفي والتحليل النفسي للشخصيات.',
        badge: 'تأمل عميق',
        speed: '~800ms',
      },
    ],
    custom: [
      {
        id: 'deepseek-chat',
        label: 'DeepSeek-V3 Chat',
        desc: 'النموذج الأحدث (V3) المتفوق عالمياً في البلاغة والتعبير العربي والأسلوب الأدبي والرمزي.',
        badge: 'موصى به',
        speed: '~300ms',
        highlight: true,
      },
      {
        id: 'deepseek-reasoner',
        label: 'DeepSeek-R1 Reasoner',
        desc: 'نموذج التفكير المنطقي المتسلسل (R1) للتأملات الفلسفية والوجودية المعقدة.',
        badge: 'تفكير متسلسل',
        speed: '~850ms',
      },
      {
        id: 'default',
        label: 'النموذج الافتراضي لنقطة النهاية',
        desc: 'استخدام النموذج المحدد افتراضياً في سيرفر Ollama أو الخادم المخصص لديك.',
        badge: 'افتراضي',
        speed: 'بحسب خادمك',
      },
    ],
  };

  const activeDiscoveredModels = availableModels[config.provider] || [];
  const activeModelItems: ProviderModelItem[] = activeDiscoveredModels.length
    ? activeDiscoveredModels.map((id) => ({ id, label: id, desc: 'نموذج مكتشف ومتاح فعليًا في حسابك', speed: 'فحص مباشر' }))
    : (providerModels[config.provider] || []);

  const providerList: { id: AIProvider; name: string; sub: string }[] = [
    { id: 'gemini', name: 'Google Gemini', sub: 'مدمج / مخصص' },
    { id: 'openai', name: 'OpenAI GPT', sub: 'مفتاح خاص' },
    { id: 'anthropic', name: 'Claude', sub: 'مفتاح خاص' },
    { id: 'groq', name: 'Groq / أخرى', sub: 'سرعة فائقة' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 animate-ink">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-amiri text-2xl font-bold">{t.settings.title}</h2>
          <p className="text-xs opacity-60 font-kanji">{t.settings.subtitle}</p>
        </div>

        {savedBadge && (
          <span className="text-xs font-amiri text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30 animate-pulse">
            {t.settings.savedSuccess}
          </span>
        )}
      </div>

      {/* Local Save Banner Notice if active */}
      {localSaveNotice && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-amiri flex items-center justify-between animate-ink">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{localSaveNotice}</span>
          </div>
          <button
            onClick={() => setLocalSaveNotice(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Language Selector Section (لغة واجهة التطبيق) */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          theme === 'dark'
            ? 'bg-[#18181D] border-[#2C2C38]'
            : 'bg-[#FAF4EB] border-[#DECDB7]'
        }`}
      >
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                theme === 'dark'
                  ? 'bg-[#8B3A3A]/20 text-[#E89292]'
                  : 'bg-[#7A3838]/15 text-[#7A3838]'
              }`}
            >
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-amiri font-bold text-base leading-tight">
                {t.settings.languageTitle}
              </h3>
              <p className="text-[11px] opacity-65 font-sans-ui mt-0.5">
                {t.settings.languageDesc}
              </p>
            </div>
          </div>

          <div className="text-[10px] font-kanji px-2 py-0.5 rounded-full border border-inherit/25 bg-inherit/10 opacity-70 hidden sm:block">
            多言語対応 · i18n
          </div>
        </div>

        {/* Language Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3">
          {/* Arabic Option */}
          <button
            type="button"
            onClick={() => {
              setLanguage('ar');
              setLocalSaveNotice('تم تحويل لغة الواجهة إلى العربية بنجاح ✓');
              setTimeout(() => setLocalSaveNotice(null), 3000);
            }}
            className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between gap-3 relative ${
              language === 'ar'
                ? theme === 'dark'
                  ? 'border-[#8B3A3A] bg-[#8B3A3A]/25 text-[#FAF6EE] shadow-sm ring-1 ring-[#8B3A3A]/60'
                  : 'border-[#7A3838] bg-[#7A3838]/15 text-[#7A3838] shadow-sm ring-1 ring-[#7A3838]/50'
                : theme === 'dark'
                ? 'border-[#2C2C38] bg-[#1E1E26]/60 hover:bg-[#252532] text-[#C5BAA8] opacity-80 hover:opacity-100'
                : 'border-[#DECDB7]/70 bg-[#F2E8D8]/50 hover:bg-[#EAE0D0] text-[#4A3B2F] opacity-80 hover:opacity-100'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-amiri text-base font-bold flex-shrink-0 border ${
                  language === 'ar'
                    ? 'border-[#8B3A3A] bg-[#8B3A3A]/40 text-white'
                    : 'border-inherit/25 bg-inherit/15'
                }`}
              >
                ض
              </span>
              <div>
                <div className="font-amiri font-bold text-sm leading-tight">العربية</div>
                <div className="text-[10px] opacity-60 font-sans-ui mt-0.5">الأصيلة (RTL)</div>
              </div>
            </div>

            {language === 'ar' && (
              <span className="w-5 h-5 rounded-full bg-[#8B3A3A] text-white flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3" />
              </span>
            )}
          </button>

          {/* English Option */}
          <button
            type="button"
            onClick={() => {
              setLanguage('en');
              setLocalSaveNotice('Interface language switched to English successfully ✓');
              setTimeout(() => setLocalSaveNotice(null), 3000);
            }}
            className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 relative ${
              language === 'en'
                ? theme === 'dark'
                  ? 'border-[#8B3A3A] bg-[#8B3A3A]/25 text-[#FAF6EE] shadow-sm ring-1 ring-[#8B3A3A]/60'
                  : 'border-[#7A3838] bg-[#7A3838]/15 text-[#7A3838] shadow-sm ring-1 ring-[#7A3838]/50'
                : theme === 'dark'
                ? 'border-[#2C2C38] bg-[#1E1E26]/60 hover:bg-[#252532] text-[#C5BAA8] opacity-80 hover:opacity-100'
                : 'border-[#DECDB7]/70 bg-[#F2E8D8]/50 hover:bg-[#EAE0D0] text-[#4A3B2F] opacity-80 hover:opacity-100'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-sans-ui text-xs font-bold flex-shrink-0 border ${
                  language === 'en'
                    ? 'border-[#8B3A3A] bg-[#8B3A3A]/40 text-white'
                    : 'border-inherit/25 bg-inherit/15'
                }`}
              >
                EN
              </span>
              <div>
                <div className="font-sans-ui font-bold text-sm leading-tight">English</div>
                <div className="text-[10px] opacity-60 font-sans-ui mt-0.5">International (LTR)</div>
              </div>
            </div>

            {language === 'en' && (
              <span className="w-5 h-5 rounded-full bg-[#8B3A3A] text-white flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3" />
              </span>
            )}
          </button>

          {/* Japanese Option */}
          <button
            type="button"
            onClick={() => {
              setLanguage('ja');
              setLocalSaveNotice('インターフェース言語を日本語に切り替えました ✓');
              setTimeout(() => setLocalSaveNotice(null), 3000);
            }}
            className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 relative ${
              language === 'ja'
                ? theme === 'dark'
                  ? 'border-[#8B3A3A] bg-[#8B3A3A]/25 text-[#FAF6EE] shadow-sm ring-1 ring-[#8B3A3A]/60'
                  : 'border-[#7A3838] bg-[#7A3838]/15 text-[#7A3838] shadow-sm ring-1 ring-[#7A3838]/50'
                : theme === 'dark'
                ? 'border-[#2C2C38] bg-[#1E1E26]/60 hover:bg-[#252532] text-[#C5BAA8] opacity-80 hover:opacity-100'
                : 'border-[#DECDB7]/70 bg-[#F2E8D8]/50 hover:bg-[#EAE0D0] text-[#4A3B2F] opacity-80 hover:opacity-100'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-kanji text-sm font-bold flex-shrink-0 border ${
                  language === 'ja'
                    ? 'border-[#8B3A3A] bg-[#8B3A3A]/40 text-white'
                    : 'border-inherit/25 bg-inherit/15'
                }`}
              >
                和
              </span>
              <div>
                <div className="font-kanji font-bold text-sm leading-tight">日本語</div>
                <div className="text-[10px] opacity-60 font-sans-ui mt-0.5">文学的表現 (LTR)</div>
              </div>
            </div>

            {language === 'ja' && (
              <span className="w-5 h-5 rounded-full bg-[#8B3A3A] text-white flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3" />
              </span>
            )}
          </button>
        </div>

        {/* Literary preservation badge */}
        <div className="mt-3 pt-2.5 border-t border-inherit/15 flex items-center justify-between text-[11px] opacity-70">
          <span className="flex items-center gap-1.5 font-amiri">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C46868]"></span>
            <span>النصوص الشذرية والرؤى الفلسفية محفوظة بلسانها العربي الأصيل كاملاً.</span>
          </span>
          <span className="font-kanji text-[10px] opacity-60 hidden md:inline">
            アラビア語文学テキスト原本保持
          </span>
        </div>
      </div>

      {/* 1. Live Provider Health Status Card (فحص المزود النشط) */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          theme === 'dark'
            ? 'bg-[#18181D] border-[#2C2C38]'
            : 'bg-[#FAF4EB] border-[#DECDB7]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                testResult.status === 'success'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : testResult.status === 'error'
                  ? 'bg-rose-500/20 text-rose-400'
                  : testResult.status === 'testing'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-[#8B3A3A]/20 text-[#C46868]'
              }`}
            >
              <Activity
                className={`w-5 h-5 ${testResult.status === 'testing' ? 'animate-spin' : ''}`}
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-amiri font-bold text-base">
                  فحص المزود النشط (هل يعمل أم لا؟)
                </h3>
                {/* Live Status Indicator Tag */}
                {testResult.status === 'success' && (
                  <span className="text-[11px] font-amiri font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    يعمل بنجاح (متصل ومستجيب)
                  </span>
                )}
                {testResult.status === 'error' && (
                  <span className="text-[11px] font-amiri font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                    لا يعمل (واجه خطأ)
                  </span>
                )}
                {testResult.status === 'testing' && (
                  <span className="text-[11px] font-amiri font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    جاري الفحص المباشر...
                  </span>
                )}
                {testResult.status === 'idle' && (
                  <span className="text-[11px] font-amiri px-2 py-0.5 rounded-full bg-inherit/20 opacity-60 border border-inherit/20">
                    لم يُفحص بعد
                  </span>
                )}
              </div>
              <p className="text-xs opacity-65 font-sans-ui mt-0.5">
                المزود: <strong className="text-[#C46868]">{config.provider.toUpperCase()}</strong> · النموذج:{' '}
                <span className="font-mono text-[11px]">{config.selectedModel}</span>
              </p>
            </div>
          </div>

          {/* Test connection action button */}
          <button
            onClick={handleTestConnection}
            disabled={testResult.status === 'testing' || testingProvider !== null}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-amiri font-bold transition-all shadow-sm ${
              theme === 'dark'
                ? 'bg-[#8B3A3A] hover:bg-[#9E4545] text-white'
                : 'bg-[#7A3838] hover:bg-[#8F4444] text-[#FAF6EE]'
            } disabled:opacity-50`}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                testResult.status === 'testing' ? 'animate-spin' : ''
              }`}
            />
            <span>
              {testResult.status === 'testing' ? 'جاري الفحص المباشر...' : 'فحص حالة المزود الآن'}
            </span>
          </button>
        </div>

        {/* Detailed Status Result Panel */}
        <div
          className={`p-3 rounded-xl border text-xs font-amiri flex flex-col gap-1.5 ${
            testResult.status === 'success'
              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
              : testResult.status === 'error'
              ? 'bg-rose-950/20 border-rose-500/30 text-rose-300'
              : testResult.status === 'testing'
              ? 'bg-amber-950/20 border-amber-500/30 text-amber-300'
              : 'bg-black/10 border-inherit/20 opacity-80'
          }`}
        >
          <div className="flex items-start gap-2">
            {testResult.status === 'success' && (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            )}
            {testResult.status === 'error' && (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            {testResult.status === 'testing' && (
              <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-spin" />
            )}
            {testResult.status === 'idle' && (
              <Activity className="w-4 h-4 opacity-50 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="leading-relaxed font-sans-ui text-xs">
                {testResult.message}
              </p>
              {testResult.testedAt > 0 && (
                <div className="flex items-center gap-3 mt-1 text-[11px] opacity-75 font-sans-ui">
                  <span>
                    آخر فحص:{' '}
                    {new Date(testResult.testedAt).toLocaleTimeString('ar-EG', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                  {testResult.latencyMs && (
                    <>
                      <span>·</span>
                      <span>
                        سرعة الاستجابة: <strong>{testResult.latencyMs}ms</strong>
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Favorites Shortcut Card */}
      <div
        onClick={onViewFavorites}
        className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
          theme === 'dark'
            ? 'bg-[#1C1C22] border-[#2C2C38] hover:border-[#8B3A3A]/60'
            : 'bg-[#FAF4EB] border-[#DECDB7] hover:border-[#7A3838]/60'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              theme === 'dark'
                ? 'bg-[#8B3A3A]/20 text-[#E89292]'
                : 'bg-[#7A3838]/15 text-[#7A3838]'
            }`}
          >
            <Bookmark className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h3 className="font-amiri font-bold text-base">شذراتي المحفوظة (المفضلة)</h3>
            <p className="text-xs opacity-60 font-sans-ui">
              {favoritesCount} شذرة محفوظة للمراجعة والتأمل
            </p>
          </div>
        </div>

        <span className="text-xs font-amiri text-[#C46868] font-bold">عرض الكل ←</span>
      </div>

      {/* AI Provider Configuration & Keys Section */}
      <div
        className={`p-5 rounded-2xl border transition-colors ${
          theme === 'dark'
            ? 'bg-[#18181C] border-[#2B2B36]'
            : 'bg-[#FAF4EB] border-[#DECDB7]'
        }`}
      >
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#C46868]" />
            <div>
              <h3 className="font-amiri text-lg font-bold">
                تكوين المزودين وفحص صحة المفاتيح (Ping)
              </h3>
              <p className="text-[11px] opacity-65">
                مؤشر حالة حي (Status Indicator) بجانب كل مزود للتحقق من صلاحية الاتصال ومفتاح الـ API.
              </p>
            </div>
          </div>
        </div>

        {/* Universal Smart Key Paste Box */}
        <div
          className={`p-3.5 sm:p-4 rounded-xl border transition-all mb-4 ${
            theme === 'dark'
              ? 'bg-[#1D1D26] border-[#36364A] shadow-inner'
              : 'bg-[#F3ECE0] border-[#D6C4AD] shadow-inner'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#C46868]/20 text-[#C46868] flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <h4 className="font-amiri font-bold text-xs sm:text-sm">
                الإلصاق الذكي الفوري لأي مفتاح (Universal Smart Setup)
              </h4>
            </div>
            <span className="text-[10px] font-sans-ui opacity-60">
              التعرف التلقائي والفحص الفوري
            </span>
          </div>

          <p className="text-[11px] opacity-75 leading-relaxed mb-2.5">
            الصق أي مفتاح لديك هنا (سواء يبدأ بـ <span className="font-mono text-emerald-400 bg-black/20 px-1 py-0.5 rounded">gsk_</span> لـ Groq، أو <span className="font-mono text-blue-400 bg-black/20 px-1 py-0.5 rounded">AIza</span> لـ Gemini، أو <span className="font-mono text-amber-400 bg-black/20 px-1 py-0.5 rounded">sk-</span> لـ OpenAI/Claude)؛ وسيقوم النظام تلقائياً بتحديد المزود، تفعيله، اختيار النموذج الأسرع، وإرسال فحص Ping للتأكد من جاهزيته!
          </p>

          <div className="relative flex items-center">
            <input
              type="text"
              value={smartPasteInput}
              onChange={(e) => handleSmartPaste(e.target.value)}
              placeholder="الصق أي مفتاح API هنا للتهيئة التلقائية الفورية (مثل gsk_...)..."
              className="w-full text-xs font-mono px-3 py-2.5 rounded-xl border border-inherit/25 bg-black/15 outline-none focus:border-[#C46868] transition-colors pr-9 pl-28"
            />
            <Key className="w-4 h-4 absolute right-3 opacity-40" />

            {smartPasteDetected && (
              <span className="absolute left-2.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1 animate-pulse">
                <Check className="w-3 h-3 text-emerald-400" />
                {smartPasteDetected}
              </span>
            )}
          </div>
        </div>

        {/* Provider Tabs with Status Indicator beside each provider */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
          {providerList.map((prov) => {
            const isSelected = config.provider === prov.id;
            const provStatus = providerStatuses[prov.id];
            const isTestingThis = testingProvider === prov.id;

            return (
              <div
                key={prov.id}
                onClick={() => {
                  audioManager.playPaperRustle();
                  handleUpdate({
                    provider: prov.id,
                    selectedModel: providerModels[prov.id][0].id,
                  });
                }}
                className={`relative p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? theme === 'dark'
                      ? 'bg-[#8B3A3A]/20 border-[#C46868] text-[#FAF6EE] shadow-sm ring-1 ring-[#C46868]/40'
                      : 'bg-[#7A3838]/15 border-[#7A3838] text-[#7A3838] shadow-sm ring-1 ring-[#7A3838]/40'
                    : 'border-inherit/20 opacity-75 hover:opacity-100 hover:bg-inherit/10'
                }`}
              >
                {/* Header: Provider Name and Status Indicator */}
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-amiri font-bold text-xs truncate">{prov.name}</span>

                  {/* Status Indicator Icon beside each provider */}
                  {isTestingThis || provStatus?.status === 'testing' ? (
                    <span
                      title="جاري فحص المزود (Ping)..."
                      className="flex items-center text-amber-400 shrink-0"
                    >
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    </span>
                  ) : provStatus?.status === 'success' ? (
                    <span
                      title={`يعمل بنجاح (${provStatus.latencyMs || ''}ms) - انقر لإعادة الفحص`}
                      className="flex items-center gap-1 shrink-0"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    </span>
                  ) : provStatus?.status === 'error' ? (
                    <span
                      title={`فشل الاتصال: ${provStatus.message}`}
                      className="flex items-center gap-1 shrink-0"
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    </span>
                  ) : (
                    <span
                      title="لم يُفحص بعد - انقر لفحصه"
                      className="w-2 h-2 rounded-full bg-gray-500/40 shrink-0"
                    ></span>
                  )}
                </div>

                <div className="text-[10px] opacity-60 font-sans-ui mb-2">{prov.sub}</div>

                {/* Status Indicator Badge & Ping Button beside each provider */}
                <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-inherit/15 mt-auto">
                  {/* Status Indicator Label */}
                  <div className="text-[10px] font-sans-ui flex items-center gap-1">
                    {isTestingThis || provStatus?.status === 'testing' ? (
                      <span className="text-amber-400 font-bold">فحص...</span>
                    ) : provStatus?.status === 'success' ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5 inline" />
                        صالح
                      </span>
                    ) : provStatus?.status === 'error' ? (
                      <span className="text-rose-400 font-bold flex items-center gap-0.5">
                        <XCircle className="w-2.5 h-2.5 inline" />
                        خطأ
                      </span>
                    ) : (
                      <span className="opacity-50">غير مفحوص</span>
                    )}
                  </div>

                  {/* Individual Ping Test Button */}
                  <button
                    type="button"
                    onClick={(e) => handleTestSpecificProvider(prov.id, e)}
                    disabled={isTestingThis}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-sans-ui flex items-center gap-0.5 border transition-all ${
                      theme === 'dark'
                        ? 'border-[#444455] bg-[#22222B] hover:bg-[#323240] text-[#D8D0C5]'
                        : 'border-[#DECDB7] bg-[#EBE0D0] hover:bg-[#E2D2BD] text-[#4A3B2F]'
                    } disabled:opacity-40`}
                    title={`إرسال اختبار خفيف (Ping) لـ ${prov.name} للتحقق من المفتاح`}
                  >
                    <Zap className="w-2.5 h-2.5 text-[#C46868]" />
                    <span>Ping</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Active Provider Form */}
        <div className="space-y-4 pt-3 border-t border-inherit/20">
          {/* Key for active provider with its dedicated Status Indicator */}
          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
              <label className="text-xs font-amiri font-bold flex items-center gap-1.5 opacity-80">
                <Key className="w-3.5 h-3.5 text-[#C46868]" />
                <span>
                  مفتاح API الخاص بـ{' '}
                  {config.provider === 'gemini'
                    ? 'Google Gemini (اختياري: الخادم مجهز بمفتاح جاهز)'
                    : config.provider === 'openai'
                    ? 'OpenAI'
                    : config.provider === 'anthropic'
                    ? 'Anthropic Claude'
                    : 'Groq / Custom Provider'}
                </span>
              </label>

              {/* Status Indicator beside the active provider key */}
              <div className="flex items-center gap-2">
                {providerStatuses[config.provider]?.status === 'success' && (
                  <span className="text-[10px] text-emerald-400 font-sans-ui flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    المفتاح صالح ومستجيب ({providerStatuses[config.provider]?.latencyMs || ''}ms)
                  </span>
                )}
                {providerStatuses[config.provider]?.status === 'error' && (
                  <span className="text-[10px] text-rose-400 font-sans-ui flex items-center gap-1 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    المفتاح غير صالح أو واجه خطأ
                  </span>
                )}
                {providerStatuses[config.provider]?.status === 'testing' && (
                  <span className="text-[10px] text-amber-400 font-sans-ui flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                    جاري الفحص (Ping)...
                  </span>
                )}

                {config.provider === 'gemini' && !config.geminiKey && (
                  <span className="text-[10px] text-emerald-500 font-sans-ui flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    المفتاح المدمج بالخادم مفعّل
                  </span>
                )}

                {/* Direct Ping button beside key */}
                <button
                  type="button"
                  onClick={() => handleTestSpecificProvider(config.provider)}
                  disabled={testingProvider !== null}
                  className="text-[10px] font-sans-ui px-2 py-0.5 rounded bg-[#8B3A3A]/20 hover:bg-[#8B3A3A]/35 text-[#E89292] border border-[#8B3A3A]/30 flex items-center gap-1 transition-colors disabled:opacity-50"
                  title="إرسال طلب فحص خفيف (Ping) للتحقق من صحة هذا المفتاح الآن"
                >
                  <Zap className="w-3 h-3" />
                  <span>فحص المفتاح (Ping)</span>
                </button>
              </div>
            </div>

            <div className="relative flex items-center">
              <input
                type={showKeys[config.provider] ? 'text' : 'password'}
                value={
                  config.provider === 'gemini'
                    ? config.geminiKey
                    : config.provider === 'openai'
                    ? config.openAiKey
                    : config.provider === 'anthropic'
                    ? config.anthropicKey
                    : config.provider === 'groq'
                    ? (config.groqKey || config.customKey)
                    : config.customKey
                }
                onChange={(e) => handleKeyChange(e.target.value)}
                placeholder={
                  config.provider === 'gemini'
                    ? 'اتركه فارغاً لاستخدام المفتاح المدمج، أو الصق مفتاحك الخاص هنا'
                    : config.provider === 'groq'
                    ? 'gsk_... الصق مفتاح Groq API هنا'
                    : `sk-... الصق مفتاح API الخاص بـ ${config.provider}`
                }
                className="w-full text-xs font-mono px-3 py-2.5 rounded-xl border border-inherit/20 bg-black/10 outline-none focus:border-[#C46868] transition-colors pr-10"
              />

              <button
                type="button"
                onClick={() => toggleShowKey(config.provider)}
                className="absolute left-2.5 p-1 opacity-60 hover:opacity-100 transition-opacity"
                title={showKeys[config.provider] ? 'إخفاء المفتاح' : 'إظهار المفتاح'}
              >
                {showKeys[config.provider] ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-amiri font-bold block opacity-90">
                النماذج العاملة في حسابك ({activeModelItems.length} نماذج):
              </label>
              <span className="text-[10px] text-emerald-400 font-sans-ui flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <Check className="w-2.5 h-2.5" /> {modelsChecking ? 'جاري فحص نماذج حسابك...' : activeDiscoveredModels.length ? 'نماذج حسابك المتاحة' : 'اضغط فحص لاكتشاف نماذج حسابك'}
              </span>
            </div>

            {/* Quick dropdown */}
            <select
              value={config.selectedModel}
              onChange={(e) => {
                audioManager.playPaperRustle();
                handleUpdate({ selectedModel: e.target.value });
              }}
              className="w-full text-xs font-sans-ui px-3 py-2.5 rounded-xl border border-inherit/20 bg-black/10 outline-none focus:border-[#C46868] transition-colors cursor-pointer mb-3"
            >
              {activeModelItems.map((m) => (
                <option
                  key={m.id}
                  value={m.id}
                  className={theme === 'dark' ? 'bg-[#18181C] text-white' : 'bg-[#FAF4EB] text-black'}
                >
                  {m.label} ({m.id}) {m.badge ? `— [${m.badge}]` : ''}
                </option>
              ))}
            </select>

            {/* Interactive Model Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activeModelItems.map((m) => {
                const isModelActive = config.selectedModel === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      audioManager.playPaperRustle();
                      handleUpdate({ selectedModel: m.id });
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between text-right relative ${
                      isModelActive
                        ? theme === 'dark'
                          ? 'bg-[#8B3A3A]/25 border-[#C46868] shadow-sm ring-1 ring-[#C46868]/50'
                          : 'bg-[#7A3838]/15 border-[#7A3838] shadow-sm ring-1 ring-[#7A3838]/50'
                        : 'border-inherit/20 bg-black/5 hover:bg-inherit/10 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          {isModelActive ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <Cpu className="w-4 h-4 opacity-40 shrink-0" />
                          )}
                          <span className="font-amiri font-bold text-xs">
                            {m.label}
                          </span>
                        </div>

                        {m.badge && (
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-bold font-sans-ui shrink-0 ${
                              m.highlight
                                ? 'bg-[#C46868]/20 text-[#C46868] border border-[#C46868]/30'
                                : 'bg-inherit/20 text-inherit/80'
                            }`}
                          >
                            {m.badge}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] opacity-75 leading-relaxed font-sans-ui mb-2.5">
                        {m.desc}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-inherit/10 text-[10px] font-mono opacity-60">
                      <span className="truncate max-w-[130px]" dir="ltr">{m.id}</span>
                      <span className="flex items-center gap-1 text-emerald-400 font-sans-ui">
                        <Zap className="w-2.5 h-2.5" />
                        {m.speed}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Base URL (if Groq / Custom) */}
          {(config.provider === 'groq' || config.provider === 'custom') && (
            <div>
              <label className="text-xs font-amiri font-bold block mb-1.5 opacity-80">
                عنوان URL للواجهة (API Base URL):
              </label>
              <input
                type="text"
                value={config.customBaseUrl}
                onChange={(e) => handleUpdate({ customBaseUrl: e.target.value })}
                placeholder="https://api.groq.com/openai/v1 أو عنوان محلي"
                className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-inherit/20 bg-black/10 outline-none focus:border-[#C46868]"
              />
            </div>
          )}

          {/* Temperature Slider */}
          <div>
            <div className="flex items-center justify-between text-xs font-amiri mb-1">
              <span className="font-bold opacity-80">
                الحرارة الأدبية (درجة الخيال والسوداوية):
              </span>
              <span className="font-mono text-[11px] text-[#C46868]">
                {config.temperature}
              </span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.2"
              step="0.05"
              value={config.temperature}
              onChange={(e) => handleUpdate({ temperature: parseFloat(e.target.value) })}
              className="w-full accent-[#8B3A3A] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] opacity-50 font-sans-ui mt-0.5">
              <span>واقعي ورصين (0.2)</span>
              <span>توازن شعري (0.85)</span>
              <span>خيال سوداوي حر (1.2)</span>
            </div>
          </div>

          {/* Local Storage & Security Guarantee Box */}
          <div
            className={`p-3.5 rounded-xl border flex flex-col gap-2.5 ${
              theme === 'dark' ? 'bg-[#121215] border-[#282832]' : 'bg-[#F2E8D8] border-[#D9C6AE]'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <div className="text-xs font-amiri font-bold text-emerald-500">
                ضمان الأمان والحفظ المحلي (Local Storage Persistence)
              </div>
            </div>
            <p className="text-[11px] opacity-75 font-sans-ui leading-relaxed">
              يتم حفظ وتخزين كافة مفاتيح الـ API محلياً في ذاكرة متصفحك فقط (Browser Local Storage). لا يتم إرسالها إلى أي خوادم طرف ثالث، وتبقى محفوظة في هذا المتصفح لتستخدمها دائماً حتى بعد إغلاق المتصفح.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleExplicitSaveLocal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-amiri font-bold bg-[#8B3A3A]/20 hover:bg-[#8B3A3A]/35 text-[#E89292] border border-[#8B3A3A]/40 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>تأكيد حفظ المفاتيح محلياً</span>
              </button>

              <button
                type="button"
                onClick={handleClearKeys}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-amiri text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors opacity-80 hover:opacity-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>مسح المفاتيح المحلية</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Daily AI Auto-Generation & Local Storage Card */}
      <div
        className={`p-5 rounded-2xl border transition-colors ${
          theme === 'dark'
            ? 'bg-[#18181C] border-[#2B2B36]'
            : 'bg-[#FAF4EB] border-[#DECDB7]'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl border ${
                theme === 'dark'
                  ? 'border-[#8B3A3A] bg-[#8B3A3A]/20 text-[#E89292]'
                  : 'border-[#7A3838] bg-[#7A3838]/15 text-[#7A3838]'
              }`}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-amiri text-lg font-bold flex items-center gap-2">
                <span>التوليد التلقائي لشذرة كل يوم وحفظها محلياً</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-sans-ui border border-emerald-500/30">
                  تلقائي محلي
                </span>
              </h3>
              <p className="text-[11px] opacity-65 font-sans-ui">
                يقوم الذكاء الاصطناعي كل يوم بتوليد شذرة أدبية وتأمل دازاي خاص جديد وحفظه في ذاكرة جهازك.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={autoDailyEnabled}
              onChange={(e) => {
                const next = e.target.checked;
                setAutoDailyEnabled(next);
                setAutoDailyQuoteEnabled(next);
                audioManager.playPaperRustle();
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B3A3A]"></div>
          </label>
        </div>

        <div className="pt-3 border-t border-inherit/15 flex flex-wrap items-center justify-between gap-2.5 text-xs font-sans-ui">
          <div className="flex items-center gap-1.5 opacity-75">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>
              {autoDailyEnabled
                ? 'التوليد اليومي مفعل — تتجدد الشذرة تلقائياً مع مطلع كل فجر'
                : 'التوليد التلقائي متوقف حالياً'}
            </span>
          </div>

          {onOpenDailyArchive && (
            <button
              type="button"
              onClick={() => {
                audioManager.playPaperRustle();
                onOpenDailyArchive();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-amiri font-bold border border-inherit/20 hover:bg-inherit/10 transition-colors"
            >
              <span>سجل شذرات الأيام المحفوظة ({dailyHistoryCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Local Daily Notifications Section */}
      <div
        className={`p-5 rounded-2xl border transition-colors ${
          theme === 'dark'
            ? 'bg-[#18181C] border-[#2B2B36]'
            : 'bg-[#FAF4EB] border-[#DECDB7]'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#C46868]" />
            <div>
              <h3 className="font-amiri text-lg font-bold">
                إشعار شذرة اليوم (Daily Reflection)
              </h3>
              <p className="text-[11px] opacity-65">
                تذكير مسائي يرسل شذرة أدبية يومية لتأملها في هدوء الليل.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notificationSettings.enabled}
              onChange={handleToggleNotification}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B3A3A]"></div>
          </label>
        </div>

        {notificationSettings.enabled && (
          <div className="pt-3 border-t border-inherit/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-amiri">وقت الإشعار المسائي:</span>
              <input
                type="time"
                value={notificationSettings.time}
                onChange={(e) => {
                  const updated = { ...notificationSettings, time: e.target.value };
                  setNotificationSettings(updated);
                  saveNotificationSettings(updated);
                }}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-inherit/20 bg-black/10 font-mono"
              />
            </div>

            <button
              onClick={handleTestNotification}
              className="w-full py-2 rounded-xl border border-inherit/20 text-xs font-amiri hover:bg-inherit/10 transition-colors"
            >
              إرسال إشعار تجريبي الآن
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
