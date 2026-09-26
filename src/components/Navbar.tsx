import React, { useState, useRef, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Smartphone,
  Monitor,
  Wind,
  Sparkles,
  Leaf,
  Sliders,
  Check,
  Bell,
  BellRing,
} from 'lucide-react';
import { audioManager } from '../utils/sound';
import { AtmosphereMode, AtmosphereDensity } from './AtmosphereCanvas';

interface NavbarProps {
  theme: 'dark' | 'sepia';
  onToggleTheme: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isMobileFrame: boolean;
  onToggleMobileFrame: () => void;
  atmosphereMode: AtmosphereMode;
  onSetAtmosphereMode: (mode: AtmosphereMode) => void;
  atmosphereDensity: AtmosphereDensity;
  onSetAtmosphereDensity: (density: AtmosphereDensity) => void;
  onOpenNotificationModal?: () => void;
  isNotificationEnabled?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  theme,
  onToggleTheme,
  soundEnabled,
  onToggleSound,
  isMobileFrame,
  onToggleMobileFrame,
  atmosphereMode,
  onSetAtmosphereMode,
  atmosphereDensity,
  onSetAtmosphereDensity,
  onOpenNotificationModal,
  isNotificationEnabled = false,
}) => {
  const [isAtmosphereMenuOpen, setIsAtmosphereMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsAtmosphereMenuOpen(false);
      }
    };
    if (isAtmosphereMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAtmosphereMenuOpen]);
  return (
    <header
      className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors duration-300 ${
        theme === 'dark'
          ? 'bg-[#141416]/90 border-[#26262B] text-[#E2D9C8]'
          : 'bg-[#F5EDE0]/95 border-[#E2D5C0] text-[#2C241D]'
      }`}
    >
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded border flex items-center justify-center font-kanji text-sm select-none transition-transform hover:scale-105 ${
              theme === 'dark'
                ? 'border-[#8B3A3A] bg-[#8B3A3A]/10 text-[#C46868] shadow-[0_0_12px_rgba(139,58,58,0.2)]'
                : 'border-[#7A3838] bg-[#7A3838]/10 text-[#7A3838]'
            }`}
            title="ختم أوسامو دازاي · 太宰治"
          >
            太宰
          </div>
          <div>
            <h1 className="font-amiri text-xl font-bold tracking-wide leading-tight">
              شذرات دازاي
            </h1>
            <p className="text-[11px] opacity-60 font-kanji flex items-center gap-1.5">
              <span>人間失格</span>
              <span>·</span>
              <span>太宰 治</span>
              <span>·</span>
              <span className="font-sans-ui text-[10px]">1909 - 1948</span>
            </p>
          </div>
        </div>

        {/* Quick Utility Actions - Harmonious & Elegant Layout */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* 1. Daily Notification Bell Button */}
          <button
            onClick={() => {
              audioManager.playPaperRustle();
              onOpenNotificationModal?.();
            }}
            className={`p-2 rounded-xl transition-all text-xs flex items-center justify-center relative ${
              isNotificationEnabled
                ? theme === 'dark'
                  ? 'bg-[#8B3A3A]/20 text-[#E89292] border border-[#8B3A3A]/40 shadow-[0_0_8px_rgba(139,58,58,0.2)]'
                  : 'bg-[#7A3838]/15 text-[#7A3838] border border-[#7A3838]/30 shadow-sm'
                : theme === 'dark'
                ? 'hover:bg-[#222227] text-[#C5BAA8]'
                : 'hover:bg-[#EAE0D0] text-[#55473B]'
            }`}
            title="تنبيهات شذرة اليوم (Local Notifications)"
            aria-label="تنبيهات شذرة اليوم"
          >
            {isNotificationEnabled ? (
              <BellRing className="w-4 h-4 text-[#C46868]" />
            ) : (
              <Bell className="w-4 h-4 opacity-65" />
            )}
            {isNotificationEnabled && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute top-1.5 right-1.5 ring-2 ring-emerald-950" />
            )}
          </button>

          {/* 2. Atmosphere Effect Toggle & Popover */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => {
                audioManager.playPaperRustle();
                setIsAtmosphereMenuOpen(!isAtmosphereMenuOpen);
              }}
              className={`p-2 rounded-xl transition-all text-xs flex items-center justify-center relative ${
                atmosphereMode !== 'off'
                  ? theme === 'dark'
                    ? 'bg-[#8B3A3A]/20 text-[#E89292] border border-[#8B3A3A]/40 shadow-[0_0_10px_rgba(139,58,58,0.25)]'
                    : 'bg-[#7A3838]/15 text-[#7A3838] border border-[#7A3838]/30 shadow-sm'
                  : theme === 'dark'
                  ? 'hover:bg-[#222227] text-[#8E867A]'
                  : 'hover:bg-[#EAE0D0] text-[#827464]'
              }`}
              title="التحكم بأجواء الخلفية (أوراق الخريف وذرات الغبار)"
              aria-label="أجواء الخلفية"
            >
              {atmosphereMode === 'autumn' ? (
                <Leaf className="w-4 h-4 text-amber-500 animate-pulse" />
              ) : atmosphereMode === 'dust' ? (
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              ) : atmosphereMode === 'both' ? (
                <Wind className="w-4 h-4 text-[#C46868]" />
              ) : (
                <Wind className="w-4 h-4 opacity-40" />
              )}
            </button>

            {/* Atmosphere Popover Menu */}
            {isAtmosphereMenuOpen && (
              <div
                className={`absolute left-0 sm:right-auto sm:left-0 top-full mt-2 w-72 p-3.5 rounded-2xl border shadow-2xl z-50 animate-ink font-amiri text-xs ${
                  theme === 'dark'
                    ? 'bg-[#18181D] border-[#2E2E39] text-[#E2D9C8]'
                    : 'bg-[#FAF4EB] border-[#D8C7B0] text-[#2C241D]'
                }`}
              >
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-inherit/20">
                  <div className="flex items-center gap-1.5">
                    <Wind className="w-4 h-4 text-[#C46868]" />
                    <span className="font-bold text-sm">أجواء السكون السوداوي</span>
                  </div>
                  <span className="text-[10px] opacity-60 font-kanji">風と木の葉</span>
                </div>

                {/* Modes */}
                <div className="space-y-1.5 mb-3">
                  <span className="text-[11px] opacity-70 block mb-1">اختر نمط الخلفية:</span>

                  {/* Both (Leaves + Dust) */}
                  <button
                    type="button"
                    onClick={() => {
                      audioManager.playPaperRustle();
                      onSetAtmosphereMode('both');
                    }}
                    className={`w-full p-2 rounded-xl text-right flex items-center justify-between transition-all ${
                      atmosphereMode === 'both'
                        ? theme === 'dark'
                          ? 'bg-[#8B3A3A]/25 border border-[#8B3A3A]/50 text-white font-bold'
                          : 'bg-[#7A3838]/20 border border-[#7A3838]/40 text-[#5A2020] font-bold'
                        : 'hover:bg-inherit/10 opacity-80'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Wind className="w-4 h-4 text-[#C46868]" />
                      <div>
                        <div className="font-bold">المزيج الشاعري (أوراق + غبار)</div>
                        <div className="text-[10px] opacity-65 font-sans-ui">
                          تساقط أوراق خريفية يابانية مع ذرات أثيرية
                        </div>
                      </div>
                    </div>
                    {atmosphereMode === 'both' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>

                  {/* Autumn Leaves Only */}
                  <button
                    type="button"
                    onClick={() => {
                      audioManager.playPaperRustle();
                      onSetAtmosphereMode('autumn');
                    }}
                    className={`w-full p-2 rounded-xl text-right flex items-center justify-between transition-all ${
                      atmosphereMode === 'autumn'
                        ? theme === 'dark'
                          ? 'bg-[#8B3A3A]/25 border border-[#8B3A3A]/50 text-white font-bold'
                          : 'bg-[#7A3838]/20 border border-[#7A3838]/40 text-[#5A2020] font-bold'
                        : 'hover:bg-inherit/10 opacity-80'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Leaf className="w-4 h-4 text-amber-500" />
                      <div>
                        <div className="font-bold">أوراق الخريف اليابانية (Momiji)</div>
                        <div className="text-[10px] opacity-65 font-sans-ui">
                          أوراق قيقب وجنكة تتمايل وتسقط في نسيم خريفي
                        </div>
                      </div>
                    </div>
                    {atmosphereMode === 'autumn' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>

                  {/* Vintage Dust Motes Only */}
                  <button
                    type="button"
                    onClick={() => {
                      audioManager.playPaperRustle();
                      onSetAtmosphereMode('dust');
                    }}
                    className={`w-full p-2 rounded-xl text-right flex items-center justify-between transition-all ${
                      atmosphereMode === 'dust'
                        ? theme === 'dark'
                          ? 'bg-[#8B3A3A]/25 border border-[#8B3A3A]/50 text-white font-bold'
                          : 'bg-[#7A3838]/20 border border-[#7A3838]/40 text-[#5A2020] font-bold'
                        : 'hover:bg-inherit/10 opacity-80'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <div>
                        <div className="font-bold">ذرات الغبار والأثير الكلاسيكي</div>
                        <div className="text-[10px] opacity-65 font-sans-ui">
                          ذرات ضوء خافت تسبح ببطء كغرف الكتب العتيقة
                        </div>
                      </div>
                    </div>
                    {atmosphereMode === 'dust' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>

                  {/* Off */}
                  <button
                    type="button"
                    onClick={() => {
                      audioManager.playPaperRustle();
                      onSetAtmosphereMode('off');
                    }}
                    className={`w-full p-2 rounded-xl text-right flex items-center justify-between transition-all ${
                      atmosphereMode === 'off'
                        ? theme === 'dark'
                          ? 'bg-white/10 border border-white/20 text-white font-bold'
                          : 'bg-black/10 border border-black/20 text-black font-bold'
                        : 'hover:bg-inherit/10 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-4 text-center font-sans font-bold opacity-60">✕</span>
                      <div className="font-bold">إيقاف المؤثرات (خلفية ساكنة)</div>
                    </div>
                    {atmosphereMode === 'off' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                </div>

                {/* Density Selector (only when active) */}
                {atmosphereMode !== 'off' && (
                  <div className="pt-2 border-t border-inherit/20">
                    <span className="text-[11px] opacity-70 block mb-1.5">كثافة المؤثرات:</span>
                    <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-black/10 text-center font-sans-ui text-[11px]">
                      {(['gentle', 'normal', 'vivid'] as AtmosphereDensity[]).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            audioManager.playPaperRustle();
                            onSetAtmosphereDensity(d);
                          }}
                          className={`py-1 rounded-md font-bold transition-colors ${
                            atmosphereDensity === d
                              ? theme === 'dark'
                                ? 'bg-[#8B3A3A] text-white'
                                : 'bg-[#7A3838] text-white'
                              : 'opacity-65 hover:opacity-100'
                          }`}
                        >
                          {d === 'gentle' ? 'هادئ' : d === 'normal' ? 'متزن' : 'كثيف'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Ambient Sound Toggle */}
          <button
            onClick={() => {
              onToggleSound();
              if (!soundEnabled) {
                audioManager.playPaperRustle();
              }
            }}
            className={`p-2 rounded-xl transition-colors text-xs flex items-center justify-center ${
              theme === 'dark'
                ? 'hover:bg-[#222227] text-[#C5BAA8]'
                : 'hover:bg-[#EAE0D0] text-[#55473B]'
            }`}
            title={soundEnabled ? 'كتم المؤثرات الصوتية والرياح' : 'تفعيل المؤثرات الصوتية والرياح'}
            aria-label="تبديل الصوت"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-[#C46868]" />
            ) : (
              <VolumeX className="w-4 h-4 opacity-50" />
            )}
          </button>

          {/* 4. Theme Toggle (Dark / Sepia) */}
          <button
            onClick={() => {
              audioManager.playPaperRustle();
              onToggleTheme();
            }}
            className={`p-2 rounded-xl transition-colors text-xs flex items-center justify-center ${
              theme === 'dark'
                ? 'hover:bg-[#222227] text-[#C5BAA8]'
                : 'hover:bg-[#EAE0D0] text-[#55473B]'
            }`}
            title={theme === 'dark' ? 'تبديل إلى وضع الورق العتيق' : 'تبديل إلى الوضع الليلي الداكن'}
            aria-label="تبديل المظهر"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-300/80" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-900" />
            )}
          </button>

          {/* 5. Desktop/Mobile Shell toggle (for previewing mobile layout on wide screens) */}
          <button
            onClick={() => {
              audioManager.playPaperRustle();
              onToggleMobileFrame();
            }}
            className={`hidden md:flex p-2 rounded-xl transition-colors text-xs items-center gap-1.5 border ${
              theme === 'dark'
                ? isMobileFrame
                  ? 'bg-[#8B3A3A]/20 border-[#8B3A3A]/40 text-[#FAF6EE]'
                  : 'border-[#2D2D35] hover:bg-[#222227] text-[#A89F91]'
                : isMobileFrame
                ? 'bg-[#7A3838]/15 border-[#7A3838]/30 text-[#7A3838]'
                : 'border-[#DDD2BF] hover:bg-[#EAE0D0] text-[#635547]'
            }`}
            title={isMobileFrame ? 'عرض متسع للشاشة' : 'محاكاة إطار الهاتف المحمول'}
          >
            {isMobileFrame ? (
              <>
                <Monitor className="w-4 h-4" />
                <span className="text-[11px] font-amiri">عرض واسع</span>
              </>
            ) : (
              <>
                <Smartphone className="w-4 h-4 text-[#C46868]" />
                <span className="text-[11px] font-amiri">إطار الهاتف</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
