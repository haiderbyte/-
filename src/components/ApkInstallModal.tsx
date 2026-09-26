import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Download,
  Share2,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Layers,
  GitBranch,
  Terminal,
  FileCode,
  Package,
  Cpu,
  WifiOff,
  BellRing,
  HelpCircle,
  FolderGit2,
  Boxes,
  ArrowRight,
} from 'lucide-react';
import { audioManager } from '../utils/sound';

interface ApkInstallModalProps {
  onClose: () => void;
  isInstallable: boolean;
  isInstalled: boolean;
  onInstall: () => Promise<boolean>;
  theme: 'dark' | 'sepia';
}

export const ApkInstallModal: React.FC<ApkInstallModalProps> = ({
  onClose,
  isInstallable,
  isInstalled,
  onInstall,
  theme,
}) => {
  const [activeTab, setActiveTab] = useState<'instant' | 'github' | 'pwabuilder'>('github');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWorkflowPath, setCopiedWorkflowPath] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // App URL for Android devices
  const appUrl = typeof window !== 'undefined' ? window.location.href : '';
  const pwaBuilderUrl = `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(appUrl)}`;

  const handleCopyAppUrl = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopiedLink(true);
      audioManager.playPaperRustle();
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Ignore
    }
  };

  const handleCopyWorkflowPath = async () => {
    try {
      await navigator.clipboard.writeText('.github/workflows/build-apk.yml');
      setCopiedWorkflowPath(true);
      audioManager.playPaperRustle();
      setTimeout(() => setCopiedWorkflowPath(false), 2500);
    } catch {
      // Ignore
    }
  };

  const handleTriggerInstall = async () => {
    audioManager.playSingingBowl();
    const success = await onInstall();
    if (success) {
      setInstallSuccess(true);
    }
  };

  // Tab definitions with distinct icons and descriptive labels
  const tabItems = [
    {
      id: 'github' as const,
      label: 'بناء عبر GitHub Actions',
      sublabel: 'ملف APK جاهز للتحميل',
      icon: FolderGit2,
      badge: 'الخيار الموصى به',
    },
    {
      id: 'instant' as const,
      label: 'تثبيت فوري بالهاتف',
      sublabel: 'WebAPK بنقرة واحدة',
      icon: Smartphone,
      badge: 'بدون حاسوب',
    },
    {
      id: 'pwabuilder' as const,
      label: 'أداة PWABuilder السحابية',
      sublabel: 'حزمة أندرويد جاهزة',
      icon: Boxes,
      badge: 'أداة خارجية',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-ink overflow-y-auto">
      <div
        className={`relative w-full max-w-xl rounded-2xl border shadow-2xl p-5 sm:p-6 my-auto transition-colors ${
          theme === 'dark'
            ? 'bg-[#18181C] border-[#2D2D38] text-[#E2D9C8]'
            : 'bg-[#FAF4EB] border-[#DECDB7] text-[#2C241D]'
        }`}
      >
        {/* Header with App Branding and Badges */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-inherit/15">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md border border-[#8B3A3A]/40 flex-shrink-0 bg-[#141416] p-0.5">
              <img
                src="/pwa-192x192.png"
                alt="شذرات دازاي"
                className="w-full h-full object-cover rounded-[14px]"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-amiri text-lg font-bold leading-tight">
                  تثبيت وبناء تطبيق أندرويد (APK)
                </h3>
                <span className="text-[10px] font-sans-ui px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-bold">
                  <Package className="w-3 h-3" />
                  <span>APK Bundle</span>
                </span>
              </div>
              <p className="text-[11px] opacity-65 font-kanji mt-0.5 flex items-center gap-1.5">
                <span>Capacitor 6.0</span>
                <span>·</span>
                <span>Android Studio</span>
                <span>·</span>
                <span>PWA Manifest</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl opacity-60 hover:opacity-100 hover:bg-inherit/10 transition-all"
            aria-label="إغلاق النافذة"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Organized Icon Tab Bar with Clear Descriptions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          {tabItems.map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  audioManager.playPaperRustle();
                  setActiveTab(tab.id);
                }}
                className={`p-2.5 rounded-xl border transition-all text-right flex flex-col justify-between relative overflow-hidden group ${
                  isCurrent
                    ? theme === 'dark'
                      ? 'border-[#8B3A3A] bg-[#8B3A3A]/20 shadow-md text-[#FAF6EE]'
                      : 'border-[#7A3838] bg-[#7A3838]/15 shadow-sm text-[#7A3838]'
                    : theme === 'dark'
                    ? 'border-[#262630] bg-[#141417]/60 hover:bg-[#1E1E24] text-[#A89F91]'
                    : 'border-[#E0D2C0] bg-[#F2E8D8]/50 hover:bg-[#EAE0D0] text-[#635547]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${
                      isCurrent
                        ? theme === 'dark'
                          ? 'bg-[#8B3A3A] text-white shadow-sm'
                          : 'bg-[#7A3838] text-white shadow-sm'
                        : 'bg-inherit/15 text-inherit'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-sans-ui font-bold ${
                      isCurrent
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-inherit/10 opacity-70'
                    }`}
                  >
                    {tab.badge}
                  </span>
                </div>

                <div>
                  <div className="font-amiri font-bold text-xs leading-tight">
                    {tab.label}
                  </div>
                  <div className="text-[10px] opacity-65 font-sans-ui mt-0.5">
                    {tab.sublabel}
                  </div>
                </div>

                {isCurrent && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#C46868] to-transparent" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab 1: GitHub Actions (Automated Cloud APK Build) */}
        {activeTab === 'github' && (
          <div className="space-y-3.5 animate-fadeIn">
            <div
              className={`p-4 rounded-xl border ${
                theme === 'dark'
                  ? 'bg-[#1E1E26] border-[#31313E]'
                  : 'bg-[#FFFDF9] border-[#D8C7B0]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                    <FolderGit2 className="w-4 h-4" />
                  </span>
                  <h4 className="font-amiri font-bold text-sm">
                    بناء ملف APK وتوقيعه تلقائياً عبر GitHub Actions
                  </h4>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-sans-ui border border-emerald-500/30 font-bold">
                  جاهز ومفعّل
                </span>
              </div>

              <p className="text-xs font-amiri opacity-80 leading-relaxed mb-3">
                تم تهيئة مجلد أندرويد الأصلي عبر <b>Capacitor</b> مع ملف سير العمل الأوتوماتيكي <b>GitHub Actions Workflow</b>:
                <code className="mx-1 px-1.5 py-0.5 rounded bg-black/20 font-mono text-[11px] text-[#E89292] font-bold">
                  .github/workflows/build-apk.yml
                </code>
              </p>

              {/* Step-by-Step Roadmap with Clear Icons */}
              <div
                className={`p-3.5 rounded-xl text-xs font-amiri leading-relaxed space-y-2.5 border mb-3 ${
                  theme === 'dark'
                    ? 'bg-black/25 border-[#2D2D38] text-[#D8CFBF]'
                    : 'bg-black/5 border-[#DECDB7] text-[#4A3D31]'
                }`}
              >
                <div className="font-bold text-[#C46868] flex items-center gap-1.5 text-xs pb-1 border-b border-inherit/15">
                  <Terminal className="w-3.5 h-3.5 text-[#C46868]" />
                  <span>خطوات استخراج ملف APK من مستودعك:</span>
                </div>

                <div className="space-y-2.5 pr-1 text-[12px]">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#8B3A3A]/25 text-[#E89292] border border-[#8B3A3A]/40 text-center font-bold font-sans-ui text-xs flex-shrink-0 flex items-center justify-center">
                      1
                    </span>
                    <div>
                      <b>ارفع أو صدّر كود المشروع إلى مستودعك على GitHub</b> (Push code to GitHub).
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#8B3A3A]/25 text-[#E89292] border border-[#8B3A3A]/40 text-center font-bold font-sans-ui text-xs flex-shrink-0 flex items-center justify-center">
                      2
                    </span>
                    <div>
                      انتقل لتبويب <b>«Actions»</b> في شريط المستودع العلوي على GitHub.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#8B3A3A]/25 text-[#E89292] border border-[#8B3A3A]/40 text-center font-bold font-sans-ui text-xs flex-shrink-0 flex items-center justify-center">
                      3
                    </span>
                    <div>
                      ستجد مهمة باسم <b>«Build Android APK»</b> تعمل تلقائياً، أو يمكنك النقر على <b>«Run workflow»</b> لتشغيلها يدوياً.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#8B3A3A]/25 text-[#E89292] border border-[#8B3A3A]/40 text-center font-bold font-sans-ui text-xs flex-shrink-0 flex items-center justify-center">
                      4
                    </span>
                    <div>
                      بعد انتهاء البناء (خلال دقيقة إلى دقيقتين)، ستجد في قسم <b>«Artifacts»</b> ملف الحزمة:
                      <div className="font-mono text-emerald-400 font-bold mt-1 text-[11px] flex items-center gap-1.5 p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25">
                        <Package className="w-3.5 h-3.5" />
                        <span>Dazai-Sparks-v1.0.apk (تنزيل وتثبيت مباشر)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons with icons & labels */}
              <div className="flex items-center justify-between gap-2 pt-1 text-xs font-amiri">
                <button
                  type="button"
                  onClick={handleCopyWorkflowPath}
                  className="px-3 py-1.5 rounded-xl border border-inherit/25 hover:bg-inherit/10 flex items-center gap-1.5 transition-colors font-bold"
                  title="نسخ مسار ملف إعداد البناء التلقائي"
                >
                  {copiedWorkflowPath ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">تم نسخ المسار بنجاح!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#C46868]" />
                      <span>نسخ مسار ملف Workflow</span>
                    </>
                  )}
                </button>

                <div className="text-[11px] opacity-70 flex items-center gap-1 font-sans-ui">
                  <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                  <span>مشروع Gradle أصلي مدمج</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Instant Native WebAPK Installation */}
        {activeTab === 'instant' && (
          <div className="space-y-3.5 animate-fadeIn">
            <div
              className={`p-4 rounded-xl border ${
                theme === 'dark'
                  ? 'bg-[#1E1E26] border-[#31313E]'
                  : 'bg-[#FFFDF9] border-[#D8C7B0]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Smartphone className="w-4 h-4" />
                  </span>
                  <h4 className="font-amiri font-bold text-sm">
                    تثبيت فوري عبر متصفح أندرويد (WebAPK)
                  </h4>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-sans-ui border border-emerald-500/30 font-bold">
                  تثبيت مباشر
                </span>
              </div>

              <p className="text-xs font-amiri opacity-75 leading-relaxed mb-3">
                يقوم متصفح هاتفك بإنشاء حزمة <b>WebAPK</b> أصلية تلقائياً وإضافتها في قائمة تطبيقات الهاتف الرسمية وتعمل بكامل كفاءتها دون اتصال.
              </p>

              {isInstalled || installSuccess ? (
                <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-amiri flex items-center gap-2 font-bold">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  <span>التطبيق مثبت بالفعل على جهازك ويعمل كتطبيق مستقل!</span>
                </div>
              ) : isInstallable ? (
                <button
                  type="button"
                  onClick={handleTriggerInstall}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-amiri font-bold text-white shadow-md flex items-center justify-center gap-2 transition-all ${
                    theme === 'dark'
                      ? 'bg-[#8B3A3A] hover:bg-[#9F4242]'
                      : 'bg-[#7A3838] hover:bg-[#8F4343]'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>تثبيت التطبيق على هاتفك الآن بنقرة واحدة</span>
                </button>
              ) : (
                <div
                  className={`p-3.5 rounded-xl text-xs font-amiri leading-relaxed space-y-2 border ${
                    theme === 'dark'
                      ? 'bg-black/20 border-[#2D2D38] text-[#C5BAA8]'
                      : 'bg-black/5 border-[#DECDB7] text-[#4A3D31]'
                  }`}
                >
                  <div className="font-bold text-[#C46868] flex items-center gap-1.5 pb-1 border-b border-inherit/15">
                    <Smartphone className="w-3.5 h-3.5 text-[#C46868]" />
                    <span>خطوات التثبيت المباشر من الهاتف:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 pr-1 text-[12px] opacity-90 leading-relaxed">
                    <li>افتح رابط التطبيق في متصفح <b>Chrome</b> أو <b>Samsung Internet</b> على هاتفك.</li>
                    <li>اضغط على زر خيارات المتصفح (الثلاث نقاط <b>⋮</b>) في الزاوية العلوية.</li>
                    <li>اختر <b>«تثبيت التطبيق»</b> أو <b>«إضافة إلى الشاشة الرئيسية»</b>.</li>
                    <li>سيتوفر التطبيق فوراً بأيقونة دازاي التراثية وشاشة كاملة.</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: PWABuilder tool */}
        {activeTab === 'pwabuilder' && (
          <div className="space-y-3.5 animate-fadeIn">
            <div
              className={`p-4 rounded-xl border ${
                theme === 'dark'
                  ? 'bg-[#1E1E26] border-[#31313E]'
                  : 'bg-[#FFFDF9] border-[#D8C7B0]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                    <Download className="w-4 h-4" />
                  </span>
                  <h4 className="font-amiri font-bold text-sm">
                    توليد ملف APK موقّع عبر أداة PWABuilder السحابية
                  </h4>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 font-sans-ui border border-indigo-500/30 font-bold">
                  أداة رسمية
                </span>
              </div>

              <p className="text-xs font-amiri opacity-75 leading-relaxed mb-3">
                منصة سحابية معتمدة من Google & Microsoft لتحويل المواقع والتطبيقات إلى حزم أندرويد APK جاهزة للتحميل والتثبيت الفوري.
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href={pwaBuilderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => audioManager.playPaperRustle()}
                  className="flex-1 py-2.5 px-3.5 rounded-xl border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-amiri font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4 text-indigo-400" />
                  <span>توليد ملف APK على PWABuilder</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </a>

                <button
                  type="button"
                  onClick={handleCopyAppUrl}
                  className="py-2.5 px-3.5 rounded-xl border border-inherit/25 hover:bg-inherit/10 text-xs font-amiri font-bold flex items-center justify-center gap-2 transition-colors"
                  title="نسخ رابط التطبيق لاستخدامه في أداة التوليد"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">تم نسخ الرابط!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-[#C46868]" />
                      <span>نسخ رابط التطبيق</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feature Highlights Grid with Distinct Visual Icons & Labels */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3.5 border-t border-inherit/15 mt-3.5">
          <div
            className={`p-2 rounded-xl border flex flex-col items-center text-center gap-1.5 ${
              theme === 'dark' ? 'bg-[#141417]/80 border-[#262630]' : 'bg-[#F2E8D8]/60 border-[#E0D2C0]'
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <WifiOff className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-amiri font-bold text-xs">دون اتصال</div>
              <div className="text-[10px] opacity-65 font-sans-ui">أوفلاين كامل</div>
            </div>
          </div>

          <div
            className={`p-2 rounded-xl border flex flex-col items-center text-center gap-1.5 ${
              theme === 'dark' ? 'bg-[#141417]/80 border-[#262630]' : 'bg-[#F2E8D8]/60 border-[#E0D2C0]'
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-amiri font-bold text-xs">حفظ محلي</div>
              <div className="text-[10px] opacity-65 font-sans-ui">مستقر ودائم</div>
            </div>
          </div>

          <div
            className={`p-2 rounded-xl border flex flex-col items-center text-center gap-1.5 ${
              theme === 'dark' ? 'bg-[#141417]/80 border-[#262630]' : 'bg-[#F2E8D8]/60 border-[#E0D2C0]'
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-[#8B3A3A]/25 text-[#E89292] flex items-center justify-center">
              <BellRing className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-amiri font-bold text-xs">إشعارات يومية</div>
              <div className="text-[10px] opacity-65 font-sans-ui">تنبيهات محلية</div>
            </div>
          </div>

          <div
            className={`p-2 rounded-xl border flex flex-col items-center text-center gap-1.5 ${
              theme === 'dark' ? 'bg-[#141417]/80 border-[#262630]' : 'bg-[#F2E8D8]/60 border-[#E0D2C0]'
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center">
              <Smartphone className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-amiri font-bold text-xs">شاشة كاملة</div>
              <div className="text-[10px] opacity-65 font-sans-ui">تجربة أصلية</div>
            </div>
          </div>
        </div>

        {/* Footer with Clear Action */}
        <div className="mt-4 pt-3.5 border-t border-inherit/15 flex items-center justify-between">
          <div className="text-[11px] opacity-60 font-sans-ui flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>حزمة آمنة بدون صلاحيات مريبة</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`px-5 py-2 rounded-xl text-xs font-amiri font-bold text-white shadow-md transition-all ${
              theme === 'dark'
                ? 'bg-[#8B3A3A] hover:bg-[#9F4242]'
                : 'bg-[#7A3838] hover:bg-[#8F4343]'
            }`}
          >
            تم والإغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

