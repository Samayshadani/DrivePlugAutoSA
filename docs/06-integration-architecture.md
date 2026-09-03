# DrivePlugAutoSA - Third-Party Integration Architecture

**Document Version:** 1.0.0  
**Pattern:** Hexagonal Architecture / Ports & Adapters  
**Resilience Standard:** Circuit Breaker, Exponential Backoff with Full Jitter, HMAC-SHA256 Signatures  

---

## 1. Architectural Philosophy: Ports & Adapters

In the automotive aftermarket, external supplier systems, SMS gateways, and payment providers vary widely from modern GraphQL APIs to legacy SOAP or FTP batch feeds.

To prevent third-party quirks from contaminating our core domain models, DrivePlugAutoSA enforces **strict port interfaces** with pluggable adapters.

```
       [Core Business Domain: Quotations & Orders]
                           │
       ┌───────────────────┼───────────────────┐
       ▼                   ▼                   ▼
 [NotificationPort]   [SupplierPort]     [PaymentPort]
       │                   │                   │
  ┌────┴────┐         ┌────┴────┐         ┌────┴────┐
  ▼         ▼         ▼         ▼         ▼         ▼
WhatsApp   SMS       TecDoc   PartsLink  Stripe   PayFast
Adapter  Adapter    Adapter   Adapter    Adapter  Adapter
```

---

## 2. Core Port Interfaces

### 2.1. `NotificationProvider`
```typescript
export interface NotificationPayload {
  recipientPhone: string;
  recipientEmail?: string;
  recipientName: string;
  template: 'QUOTE_SENT' | 'QUOTE_APPROVED' | 'PARTS_READY' | 'ORDER_UPDATE';
  variables: Record<string, string | number>;
  trackingId?: string;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  provider: string;
  deliveredAt?: Date;
  error?: string;
}

export interface NotificationProvider {
  sendWhatsApp(payload: NotificationPayload): Promise<NotificationResult>;
  sendSms(payload: NotificationPayload): Promise<NotificationResult>;
  sendEmail(payload: NotificationPayload): Promise<NotificationResult>;
}
```

### 2.2. `SupplierProvider`
```typescript
export interface SupplierPartQuery {
  partNumber: string;
  vin?: string;
  brand?: string;
}

export interface SupplierOffer {
  supplierSku: string;
  partNumber: string;
  name: string;
  costPrice: number;
  currency: string;
  stockQuantity: number;
  availability: 'IN_STOCK' | 'LOW_STOCK' | 'ORDER_ON_DEMAND' | 'OUT_OF_STOCK';
  leadTimeDays: number;
  expiresAt: Date;
}

export interface SupplierOrderPayload {
  orderNumber: string;
  items: Array<{ supplierSku: string; quantity: number; agreedPrice: number }>;
  deliveryAddress: string;
  idempotencyKey: string;
}

export interface SupplierProvider {
  searchOffers(query: SupplierPartQuery): Promise<SupplierOffer[]>;
  dispatchPurchaseOrder(payload: SupplierOrderPayload): Promise<{ supplierOrderId: string; status: string }>;
}
```

### 2.3. `PaymentProvider`
```typescript
export interface PaymentIntentPayload {
  amount: number;
  currency: string;
  quotationId: string;
  customerEmail: string;
  idempotencyKey: string;
}

export interface PaymentProvider {
  createPaymentIntent(payload: PaymentIntentPayload): Promise<{ clientSecret: string; paymentUrl: string }>;
  verifyWebhookSignature(rawBody: string, signature: string): Promise<boolean>;
}
```

---

## 3. Resilience Engineering

### 3.1. Exponential Backoff with Full Jitter
External supplier APIs and SMS aggregators suffer transient network failures and rate limits. The integration client automatically wraps external calls:

$$T_{\text{sleep}} = \min(T_{\text{max}}, T_{\text{base}} \times 2^{\text{attempt}}) \times \text{random}(0, 1)$$

- $T_{\text{base}} = 200\,\text{ms}$
- Max attempts = 3
- $T_{\text{max}} = 3000\,\text{ms}$

### 3.2. Strict Request Timeouts
Calls to external vendors are bounded by an `AbortController` timeout (e.g. 5 seconds for supplier price lookup, 8 seconds for payment initialization). A slow vendor will never hang our Next.js serverless execution.

### 3.3. Webhook Signature Verification (HMAC-SHA256)
All inbound webhooks (e.g. supplier shipping updates, WhatsApp delivery receipts, payment confirmations) MUST provide an HMAC signature in headers (e.g. `x-webhook-signature`).
```typescript
export function verifyHmacSignature(rawBody: string, signature: string, secret: string): boolean {
  const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
}
```

### 3.4. Idempotency Guarantees
All state-modifying requests (e.g. order dispatch, payment charge) accept an `Idempotency-Key` header. Keys are recorded in cache/database with an expiry of 24 hours. Replaying a request with the same idempotency key returns the cached response rather than executing a duplicate charge or supplier order.
