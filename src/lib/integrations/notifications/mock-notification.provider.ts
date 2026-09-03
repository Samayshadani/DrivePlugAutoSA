import { NotificationPayload, NotificationProvider, NotificationResult } from '../interfaces';
import crypto from 'crypto';

export class MockAutomotiveNotificationProvider implements NotificationProvider {
  public name = 'MockAutomotiveNotificationProvider';
  public sentMessages: Array<NotificationPayload & { channel: 'whatsapp' | 'sms' | 'email'; messageId: string }> = [];

  async sendWhatsApp(payload: NotificationPayload): Promise<NotificationResult> {
    const messageId = `wa_${crypto.randomUUID().slice(0, 8)}`;
    this.sentMessages.push({ ...payload, channel: 'whatsapp', messageId });

    console.log(`[WHATSAPP DISPATCH] To: ${payload.recipientPhone} | Template: ${payload.template} | Vars:`, payload.variables);

    return {
      success: true,
      messageId,
      provider: 'MockWhatsAppCloudAPI',
      deliveredAt: new Date().toISOString(),
    };
  }

  async sendSms(payload: NotificationPayload): Promise<NotificationResult> {
    const messageId = `sms_${crypto.randomUUID().slice(0, 8)}`;
    this.sentMessages.push({ ...payload, channel: 'sms', messageId });

    console.log(`[SMS DISPATCH] To: ${payload.recipientPhone} | Template: ${payload.template}`);

    return {
      success: true,
      messageId,
      provider: 'MockTwilioSMS',
      deliveredAt: new Date().toISOString(),
    };
  }

  async sendEmail(payload: NotificationPayload): Promise<NotificationResult> {
    const messageId = `mail_${crypto.randomUUID().slice(0, 8)}`;
    this.sentMessages.push({ ...payload, channel: 'email', messageId });

    return {
      success: true,
      messageId,
      provider: 'MockSendGrid',
      deliveredAt: new Date().toISOString(),
    };
  }
}

export const defaultNotificationProvider = new MockAutomotiveNotificationProvider();
