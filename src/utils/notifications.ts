import { Quote } from '../types';
import { notificationManager } from './notificationManager';

export async function requestNotificationPermission(): Promise<boolean> {
  return notificationManager.requestPermission();
}

export function sendLocalQuoteNotification(quote: Quote) {
  notificationManager.sendTestNotification(quote);
  return true;
}

