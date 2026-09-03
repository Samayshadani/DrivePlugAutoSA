import { NextRequest } from 'next/server';
import { verifyHmacSha256 } from '@/lib/integrations/security/hmac';
import { apiError, apiSuccess } from '@/lib/api/response';

const WEBHOOK_SECRET = process.env.WEBHOOK_SIGNING_SECRET || 'dev_supplier_webhook_secret_key_123';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature');

    if (!signature) {
      return apiError('UNAUTHORIZED', 'Missing x-webhook-signature header', 401);
    }

    const isValid = verifyHmacSha256(rawBody, signature, WEBHOOK_SECRET);
    if (!isValid) {
      return apiError('FORBIDDEN', 'Invalid HMAC-SHA256 webhook signature', 403);
    }

    const payload = JSON.parse(rawBody);
    console.log('[SUPPLIER WEBHOOK INGESTED]:', payload.eventType, payload.supplierCode);

    // Return receipt confirmation
    return apiSuccess({
      received: true,
      eventType: payload.eventType,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return apiError('BAD_REQUEST', `Malformed webhook payload: ${error.message}`, 400);
  }
}
