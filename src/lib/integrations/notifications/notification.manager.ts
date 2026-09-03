import { NotificationPayload, NotificationProvider } from '../interfaces';
import { defaultNotificationProvider } from './mock-notification.provider';
import { withRetry } from '../resilience/retry';

export class NotificationManager {
  private provider: NotificationProvider;

  constructor(provider: NotificationProvider = defaultNotificationProvider) {
    this.provider = provider;
  }

  setProvider(provider: NotificationProvider) {
    this.provider = provider;
  }

  async notifyQuoteSent(payload: NotificationPayload) {
    return withRetry(() => this.provider.sendWhatsApp(payload), {
      maxAttempts: 2,
      baseDelayMs: 50,
    });
  }

  async notifyQuoteApproved(payload: NotificationPayload) {
    return withRetry(() => this.provider.sendWhatsApp(payload), {
      maxAttempts: 2,
      baseDelayMs: 50,
    });
  }
}

export const notificationManager = new NotificationManager();
