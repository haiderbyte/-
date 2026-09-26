import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import {
  getNotificationSettings,
  saveNotificationSettings,
  NotificationSettings,
  getDailyQuote,
} from './storage';
import { Quote } from '../types';

export interface NotificationStatusInfo {
  supported: boolean;
  permission: 'granted' | 'denied' | 'default' | 'unsupported';
  isNative: boolean;
  settings: NotificationSettings;
}

class NotificationManager {
  private timerId: number | null = null;
  private intervalCheckId: number | null = null;

  public isSupported(): boolean {
    if (Capacitor.isNativePlatform()) return true;
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  public async getPermissionStatus(): Promise<'granted' | 'denied' | 'default' | 'unsupported'> {
    if (!this.isSupported()) return 'unsupported';

    if (Capacitor.isNativePlatform()) {
      try {
        const check = await LocalNotifications.checkPermissions();
        if (check.display === 'granted') return 'granted';
        if (check.display === 'denied') return 'denied';
        return 'default';
      } catch {
        return 'default';
      }
    }

    if (typeof Notification !== 'undefined') {
      return Notification.permission as 'granted' | 'denied' | 'default';
    }

    return 'unsupported';
  }

  public async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;

    if (Capacitor.isNativePlatform()) {
      try {
        const res = await LocalNotifications.requestPermissions();
        return res.display === 'granted';
      } catch (e) {
        console.error('Error requesting native notifications permission:', e);
        return false;
      }
    }

    if (typeof Notification !== 'undefined') {
      try {
        const result = await Notification.requestPermission();
        return result === 'granted';
      } catch (e) {
        console.error('Error requesting web notification permission:', e);
        return false;
      }
    }

    return false;
  }

  public async getStatus(): Promise<NotificationStatusInfo> {
    const supported = this.isSupported();
    const permission = await this.getPermissionStatus();
    const isNative = this.isNative();
    const settings = getNotificationSettings();

    return {
      supported,
      permission,
      isNative,
      settings,
    };
  }

  /**
   * Schedules or reschedules the daily notification based on current settings
   */
  public async scheduleDailyNotification(quote?: Quote): Promise<boolean> {
    const settings = getNotificationSettings();
    const targetQuote = quote || getDailyQuote();

    if (!settings.enabled) {
      await this.cancelAllScheduled();
      return true;
    }

    const perm = await this.getPermissionStatus();
    if (perm !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) return false;
    }

    const [hourStr, minuteStr] = settings.time.split(':');
    const hour = parseInt(hourStr || '21', 10);
    const minute = parseInt(minuteStr || '0', 10);

    // 1. If running as native Android/iOS APK via Capacitor
    if (Capacitor.isNativePlatform()) {
      try {
        // Cancel existing notification with id 101 first
        await LocalNotifications.cancel({ notifications: [{ id: 101 }] });

        await LocalNotifications.schedule({
          notifications: [
            {
              id: 101,
              title: '🍂 شذرة اليوم · أوسامو دازاي',
              body: `«${targetQuote.textAr.slice(0, 110)}${targetQuote.textAr.length > 110 ? '...' : ''}»`,
              schedule: {
                on: {
                  hour,
                  minute,
                },
                repeats: true,
                allowWhileIdle: true,
              },
              sound: 'res_bell',
              smallIcon: 'ic_launcher',
              extra: {
                quoteId: targetQuote.id,
                source: targetQuote.source,
              },
            },
          ],
        });
        return true;
      } catch (err) {
        console.error('Failed to schedule native LocalNotification:', err);
      }
    }

    // 2. Web / PWA fallback scheduling
    this.setupWebScheduler(hour, minute, targetQuote);
    return true;
  }

  /**
   * Cancel all notifications
   */
  public async cancelAllScheduled(): Promise<void> {
    if (this.timerId) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.intervalCheckId) {
      window.clearInterval(this.intervalCheckId);
      this.intervalCheckId = null;
    }

    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.cancel({ notifications: [{ id: 101 }] });
      } catch {
        // Ignore
      }
    }
  }

  /**
   * Immediately triggers a notification for testing
   */
  public async sendTestNotification(quote?: Quote): Promise<boolean> {
    const targetQuote = quote || getDailyQuote();
    const perm = await this.getPermissionStatus();

    if (perm !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) return false;
    }

    // Native Capacitor notification
    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: 999,
              title: '🍂 تجربة التنبيه · شذرات أوسامو دازاي',
              body: `«${targetQuote.textAr.slice(0, 120)}»\n— ${targetQuote.source}`,
              schedule: { at: new Date(Date.now() + 1000) },
              sound: 'res_bell',
              smallIcon: 'ic_launcher',
            },
          ],
        });
        return true;
      } catch (e) {
        console.error('Error sending native test notification:', e);
      }
    }

    // Web / PWA Notification
    try {
      const title = '🍂 تجربة التنبيه · شذرة أوسامو دازاي';
      const body = `«${targetQuote.textAr.slice(0, 120)}${targetQuote.textAr.length > 120 ? '...' : ''}»\n— ${targetQuote.source}`;
      const options: NotificationOptions = {
        body,
        icon: '/pwa-192x192.png',
        badge: '/favicon.svg',
        tag: 'dazai-test-notification',
        dir: 'rtl',
        lang: 'ar',
      };

      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.ready;
          if (reg && 'showNotification' in reg) {
            await reg.showNotification(title, options);
            return true;
          }
        } catch {
          // Fall back to window.Notification
        }
      }

      if (typeof Notification !== 'undefined') {
        new Notification(title, options);
        return true;
      }
    } catch (e) {
      console.error('Error dispatching test notification:', e);
      return false;
    }

    return false;
  }

  /**
   * Sets up browser-based scheduling
   */
  private setupWebScheduler(hour: number, minute: number, quote: Quote) {
    if (this.timerId) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.intervalCheckId) {
      window.clearInterval(this.intervalCheckId);
      this.intervalCheckId = null;
    }

    const checkAndDispatch = async () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const todayDateStr = now.toISOString().split('T')[0];

      const settings = getNotificationSettings();
      if (!settings.enabled) return;

      // If matches time and hasn't notified today
      if (
        currentHour === hour &&
        currentMinute === minute &&
        settings.lastSentDate !== todayDateStr
      ) {
        await this.dispatchWebDailyNotification(quote);
        saveNotificationSettings({
          ...settings,
          lastSentDate: todayDateStr,
        });
      }
    };

    // Calculate time until next target
    const now = new Date();
    const nextTarget = new Date();
    nextTarget.setHours(hour, minute, 0, 0);
    if (nextTarget.getTime() <= now.getTime()) {
      nextTarget.setDate(nextTarget.getDate() + 1);
    }
    const msUntilNext = nextTarget.getTime() - now.getTime();

    // Specific timer for exact trigger
    this.timerId = window.setTimeout(async () => {
      await checkAndDispatch();
      // Re-setup for next day
      this.setupWebScheduler(hour, minute, quote);
    }, msUntilNext);

    // Also periodic check every 30 seconds to catch wake-from-sleep events
    this.intervalCheckId = window.setInterval(checkAndDispatch, 30000);
  }

  private async dispatchWebDailyNotification(quote: Quote) {
    try {
      const title = '🍂 شذرة اليوم · أوسامو دازاي';
      const body = `«${quote.textAr.slice(0, 120)}${quote.textAr.length > 120 ? '...' : ''}»\n— ${quote.source}`;
      const options: NotificationOptions = {
        body,
        icon: '/pwa-192x192.png',
        badge: '/favicon.svg',
        tag: 'dazai-daily-spark',
        dir: 'rtl',
        lang: 'ar',
      };

      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if (reg && 'showNotification' in reg) {
          await reg.showNotification(title, options);
          return;
        }
      }

      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification(title, options);
      }
    } catch (e) {
      console.error('Error dispatching daily notification:', e);
    }
  }
}

export const notificationManager = new NotificationManager();
