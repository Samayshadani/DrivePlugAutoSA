// ============================================================================
// DrivePlugAutoSA - Third-Party Integration Port Interfaces
// ============================================================================

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
  deliveredAt: string;
  error?: string;
}

export interface NotificationProvider {
  name: string;
  sendWhatsApp(payload: NotificationPayload): Promise<NotificationResult>;
  sendSms(payload: NotificationPayload): Promise<NotificationResult>;
  sendEmail(payload: NotificationPayload): Promise<NotificationResult>;
}

export interface SupplierOfferResult {
  supplierSku: string;
  partNumber: string;
  name: string;
  costPrice: number;
  currency: string;
  stockQuantity: number;
  availability: 'IN_STOCK' | 'LOW_STOCK' | 'ORDER_ON_DEMAND' | 'OUT_OF_STOCK';
  leadTimeDays: number;
}

export interface SupplierProvider {
  name: string;
  fetchLivePricing(partNumber: string): Promise<SupplierOfferResult[]>;
  dispatchOrder(orderPayload: {
    orderNumber: string;
    items: Array<{ sku: string; quantity: number; costPrice: number }>;
  }): Promise<{ supplierRef: string; status: string }>;
}

export interface PaymentIntentPayload {
  amount: number;
  currency: string;
  quotationId: string;
  customerEmail: string;
  idempotencyKey: string;
}

export interface PaymentProvider {
  name: string;
  createPaymentIntent(payload: PaymentIntentPayload): Promise<{
    clientSecret: string;
    paymentUrl: string;
  }>;
  verifyWebhook(rawBody: string, signature: string): boolean;
}
