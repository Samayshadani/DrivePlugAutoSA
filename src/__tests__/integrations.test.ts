import { describe, it, expect, vi } from 'vitest';
import { withRetry } from '@/lib/integrations/resilience/retry';
import { withTimeout } from '@/lib/integrations/resilience/timeout';
import { verifyHmacSha256, generateHmacSha256 } from '@/lib/integrations/security/hmac';
import { MockAutomotiveNotificationProvider } from '@/lib/integrations/notifications/mock-notification.provider';

describe('Integration Layer Resilience & Security', () => {
  it('retries transient failures and succeeds upon recovery', async () => {
    let callCount = 0;
    const transientOperation = vi.fn(async () => {
      callCount++;
      if (callCount < 3) {
        throw new Error('Temporary 503 Supplier Gateway Timeout');
      }
      return { status: 'SUCCESS', offersFound: 4 };
    });

    const result = await withRetry(transientOperation, {
      maxAttempts: 4,
      baseDelayMs: 10,
    });

    expect(result.status).toBe('SUCCESS');
    expect(callCount).toBe(3);
  });

  it('fails deterministically when retry limit is exceeded', async () => {
    const alwaysFailing = vi.fn(async () => {
      throw new Error('Permanent 500 Internal Supplier Error');
    });

    await expect(
      withRetry(alwaysFailing, { maxAttempts: 2, baseDelayMs: 5 })
    ).rejects.toThrow('Permanent 500 Internal Supplier Error');
  });

  it('aborts long-running supplier calls using withTimeout', async () => {
    const hangingCall = new Promise((resolve) => setTimeout(resolve, 500));

    await expect(withTimeout(hangingCall, 50, 'Supplier search timed out')).rejects.toThrow(
      'Supplier search timed out'
    );
  });

  it('validates authentic HMAC-SHA256 webhook signatures and rejects tampered bodies', () => {
    const secret = 'super_secret_webhook_key_2026';
    const originalBody = JSON.stringify({
      eventType: 'PARTS_SHIPPED',
      trackingNumber: 'RAM-991823',
      itemsCount: 3,
    });

    const signature = generateHmacSha256(originalBody, secret);

    // Valid signature should pass
    const isValid = verifyHmacSha256(originalBody, signature, secret);
    expect(isValid).toBe(true);

    // Tampered payload must fail
    const tamperedBody = JSON.stringify({
      eventType: 'PARTS_SHIPPED',
      trackingNumber: 'RAM-991823',
      itemsCount: 999, // Altered
    });

    const isTamperedValid = verifyHmacSha256(tamperedBody, signature, secret);
    expect(isTamperedValid).toBe(false);

    // Wrong secret must fail
    const isWrongSecretValid = verifyHmacSha256(originalBody, signature, 'wrong_key');
    expect(isWrongSecretValid).toBe(false);
  });

  it('dispatches notifications through the mock automotive provider', async () => {
    const provider = new MockAutomotiveNotificationProvider();
    const result = await provider.sendWhatsApp({
      recipientPhone: '+27825550192',
      recipientName: 'Sarah Jenkins',
      template: 'QUOTE_SENT',
      variables: {
        quoteNumber: 'QT-2026-0001',
        grandTotal: 2012.5,
      },
    });

    expect(result.success).toBe(true);
    expect(result.provider).toBe('MockWhatsAppCloudAPI');
    expect(provider.sentMessages.length).toBe(1);
    expect(provider.sentMessages[0].recipientPhone).toBe('+27825550192');
  });
});
