import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  BellRing,
  Clock,
  Check,
  AlertCircle,
  Sparkles,
  Smartphone,
  Send,
  Volume2,
  Calendar,
} from 'lucide-react';
import {
  notificationManager,
  NotificationStatusInfo,
} from '../utils/notificationManager';
import {
  getNotificationSettings,
  saveNotificationSettings,
  NotificationSettings,
} from '../utils/storage';
import { Quote } from '../types';
import { audioManager } from '../utils/sound';

interface DailyNotificationModalProps {
  onClose: () => void;
  dailyQuote: Quote;
  theme: 'dark' | 'sepia';
}

const PRESET_TIMES = [
  { label: 'سكون الليل', time: '22:00', icon: '🌙', desc: 'أجواء القراءة الليلية الهادئة' },
  { label: 'ساعة الغسق', time: '18:30', icon: '🌆', desc: 'لحظة غروب الشمس والسكينة' },
  { label: 'فترة الظهيرة', time: '14:00', icon: '☕', desc: 'استراحة تأمل في منتصف اليوم' },
  { label: 'صباح باكر', time: '08:00', icon: '🌅', desc: 'شذرة فلسفية لبداية اليوم' },
];

export const DailyNotificationModal: React.FC<DailyNotificationModalProps> = ({
  onClose,
  dailyQuote,
  theme,
}) => {
  const [settings, setSettings] = useState<NotificationSettings>(() => getNotificationSettings());
  const [status, setStatus] = useState<NotificationStatusInfo | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'failed' | null>(null);
  const [permissionMsg, setPermissionMsg] = useState<string | null>(null);

  useEffect(() => {
    notificationManager.getStatus().then((st) => setStatus(st));
  }, []);

  const handleToggleEnable = async (enable: boolean) => {
    audioManager.playPaperRustle();
    if (enable) {
      const perm = await notificationManager.getPermissionStatus();
      if (perm !== 'granted') {
        const granted = await notificationManager.requestPermission();
        if (!granted) {
          setPermissionMsg('يرجى السماح بصلاحية الإشعارات من إعدادات المتصفح أو الجهاز لتلقي التنبيهات.');
          return;
        }
      }
    }

    const updated = { ...settings, enabled: enable };
    setSettings(updated);
    saveNotificationSettings(updated);
    await notificationManager.scheduleDailyNotification(dailyQuote);
    const updatedStatus = await notificationManager.getStatus();
    setStatus(updatedStatus);
  };

  const handleTimeChange = async (newTime: string) => {
    audioManager.playPaperRustle();
    const updated = { ...settings, time: newTime };
    setSettings(updated);
    saveNotificationSettings(updated);
    if (settings.enabled) {
      await notificationManager.scheduleDailyNotification(dailyQuote);
    }
  };

  const handleTestNotification = async () => {
    setIsTesting(true);
    setTestResult(null);
    setPermissionMsg(null);
    audioManager.playSingingBowl();

    try {
      const ok = await notificationManager.sendTestNotification(dailyQuote);
      if (ok) {
        setTestResult('success');
      } else {
        setTestResult('failed');
        setPermissionMsg('تعذر إظهار التنبيه. تأكد من تفعيل إشعارات المتصفح أو التطبيق.');
      }
    } catch {
      setTestResult('failed');
    } finally {
      setIsTesting(false);
      const updatedStatus = await notificationManager.getStatus();
      setStatus(updatedStatus);
      setTimeout(() => setTestResult(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-ink overflow-y-auto">
      <div
        className={`relative w-full max-w-lg rounded-2xl border shadow-2xl p-5 sm:p-6 my-auto transition-colors ${
          theme === 'dark'
            ? 'bg-[#18181D] border-[#2E2E39] text-[#E2D9C8]'
            : 'bg-[#FAF4EB] border-[#D8C7B0] text-[#2C241D]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-inherit/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#8B3A3A]/20 border border-[#8B3A3A]/40 flex items-center justify-center text-[#E89292]">
              {settings.enabled ? (
                <BellRing className="w-5 h-5 animate-pulse" />
              ) : (
                <Bell className="w-5 h-5 opacity-70" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-amiri text-lg font-bold">تنبيهات شذرة اليوم</h3>
                <span className="text-[10px] font-sans-ui px-2 py-0.5 rounded-full bg-[#8B3A3A]/15 text-[#E89292] border border-[#8B3A3A]/30">
                  تنبيه محلي
                </span>
              </div>
              <p className="text-[11px] opacity-65 font-kanji mt-0.5">
                毎日の言葉 · Local Daily Spark
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Permission Alert (if needed) */}
        {permissionMsg && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-amiri flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{permissionMsg}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Main Toggle Box */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${
              settings.enabled
                ? theme === 'dark'
                  ? 'bg-[#8B3A3A]/15 border-[#8B3A3A]/40'
                  : 'bg-[#7A3838]/10 border-[#7A3838]/30'
                : theme === 'dark'
                ? 'bg-[#202027] border-[#343442]'
                : 'bg-[#FFFDF9] border-[#D8C7B0]'
            }`}
          >
            <div>
              <div className="font-amiri font-bold text-sm flex items-center gap-2">
                <span>تفعيل التنبيه اليومي التلقائي</span>
                {settings.enabled && (
                  <span className="text-[10px] font-sans-ui px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                    مفعّل
                  </span>
                )}
              </div>
              <p className="text-xs font-amiri opacity-70 mt-1">
                استلام شذرة أدبية مختارة من دازاي مرة واحدة يومياً على هاتفك
              </p>
            </div>

            {/* Toggle Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={settings.enabled}
              onClick={() => handleToggleEnable(!settings.enabled)}
              className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.enabled ? 'bg-emerald-600' : 'bg-gray-600/40'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.enabled ? 'translate-x-0' : '-translate-x-5'
                }`}
              />
            </button>
          </div>

          {/* Time Picker & Presets */}
          <div
            className={`p-4 rounded-xl border space-y-3 ${
              theme === 'dark'
                ? 'bg-[#202027] border-[#343442]'
                : 'bg-[#FFFDF9] border-[#D8C7B0]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#C46868]" />
                <h4 className="font-amiri font-bold text-sm">وقت وصول الشذرة</h4>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-black/20 text-[#E89292]">
                {settings.time}
              </span>
            </div>

            {/* Custom Time Input */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-amiri opacity-75">حدد الوقت بدقة:</label>
              <input
                type="time"
                value={settings.time}
                onChange={(e) => handleTimeChange(e.target.value)}
                className={`px-3 py-1.5 rounded-lg border text-sm font-mono text-center focus:outline-none transition-colors ${
                  theme === 'dark'
                    ? 'bg-[#18181D] border-[#383846] text-white focus:border-[#C46868]'
                    : 'bg-white border-[#D8C7B0] text-black focus:border-[#7A3838]'
                }`}
              />
            </div>

            {/* Presets */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {PRESET_TIMES.map((preset) => {
                const isSelected = settings.time === preset.time;
                return (
                  <button
                    key={preset.time}
                    type="button"
                    onClick={() => handleTimeChange(preset.time)}
                    className={`p-2 rounded-xl border text-right transition-all flex flex-col justify-between ${
                      isSelected
                        ? theme === 'dark'
                          ? 'bg-[#8B3A3A]/25 border-[#8B3A3A] text-white shadow-sm'
                          : 'bg-[#7A3838]/15 border-[#7A3838] text-[#5A2020] shadow-sm'
                        : 'border-inherit/20 hover:bg-inherit/10 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        <span>{preset.icon}</span>
                        <span>{preset.label}</span>
                      </span>
                      <span className="font-mono text-[11px] opacity-80">{preset.time}</span>
                    </div>
                    <span className="text-[10px] opacity-60 font-sans-ui mt-1">
                      {preset.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Today's Quote Sample Preview */}
          <div
            className={`p-3.5 rounded-xl border space-y-1.5 ${
              theme === 'dark'
                ? 'bg-black/25 border-[#2E2E38]'
                : 'bg-black/5 border-[#DECDB7]'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] opacity-70">
              <span className="flex items-center gap-1 font-bold">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>نص إشعار اليوم المجدول:</span>
              </span>
              <span className="font-sans-ui">{dailyQuote.source}</span>
            </div>
            <p className="text-xs font-amiri leading-relaxed opacity-90 italic">
              «{dailyQuote.textAr.slice(0, 110)}...»
            </p>
          </div>

          {/* Test Notification Button & Status */}
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleTestNotification}
              disabled={isTesting}
              className={`w-full sm:w-auto flex-1 py-2.5 px-4 rounded-xl text-xs font-amiri font-bold border transition-all flex items-center justify-center gap-2 ${
                theme === 'dark'
                  ? 'border-[#8B3A3A]/50 bg-[#8B3A3A]/20 hover:bg-[#8B3A3A]/30 text-[#E89292]'
                  : 'border-[#7A3838]/40 bg-[#7A3838]/15 hover:bg-[#7A3838]/25 text-[#7A3838]'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isTesting ? 'جارِ إرسال التنبيه...' : 'جرّب التنبيه فوراً الآن'}</span>
            </button>

            {testResult === 'success' && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-amiri font-bold px-2 py-1 rounded bg-emerald-500/15">
                <Check className="w-4 h-4" />
                <span>تم إرسال التنبيه التجريبي بنجاح!</span>
              </div>
            )}
          </div>

          {/* Environmental Delivery Info */}
          <div className="pt-2 border-t border-inherit/15 text-[11px] font-amiri opacity-70 space-y-1">
            <div className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-[#C46868]" />
              <span>
                <b>على تطبيق أندرويد (APK):</b> تعمل التنبيهات في الخلفية تلقائياً حتى عندما يكون التطبيق وشاشة الهاتف مغلقة تماماً.
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>
                <b>على المتصفح / PWA:</b> يتم إرسال التنبيه فور حلول الموعد بنظام Web Notifications.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-inherit/20 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className={`px-5 py-2 rounded-xl text-xs font-amiri font-bold text-white shadow-md transition-all ${
              theme === 'dark'
                ? 'bg-[#8B3A3A] hover:bg-[#9F4242]'
                : 'bg-[#7A3838] hover:bg-[#8F4343]'
            }`}
          >
            حفظ وإغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
