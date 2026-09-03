import crypto from 'crypto';

/**
 * Verifies webhook HMAC-SHA256 signature using timing-safe equality
 */
export function verifyHmacSha256(rawBody: string, signature: string, secret: string): boolean {
  try {
    const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const signatureBuffer = Buffer.from(signature, 'hex');
    const computedBuffer = Buffer.from(computed, 'hex');

    if (signatureBuffer.length !== computedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(signatureBuffer, computedBuffer);
  } catch {
    return false;
  }
}

export function generateHmacSha256(rawBody: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
}
