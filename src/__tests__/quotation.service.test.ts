import { describe, it, expect, beforeEach } from 'vitest';
import { quotationService } from '@/lib/domain/quotations/quotation.service';
import { db } from '@/lib/db/store';
import { DomainError } from '@/lib/api/error-handler';

describe('Quotation Domain Service & Calculations', () => {
  const APEX_BUSINESS_ID = '11111111-1111-1111-1111-111111111111';
  const SARAH_CUSTOMER_ID = 'c1111111-1111-1111-1111-111111111111';
  const BMW_VEHICLE_ID = 'v1111111-1111-1111-1111-111111111111';

  it('calculates parts markup, labor totals, VAT and grand total with 100% precision', () => {
    const items = [
      {
        itemType: 'PART' as const,
        description: 'Brembo Brake Pads',
        quantity: 2,
        unitCost: 500.0, // Cost 500
        markupPct: 20.0, // 20% markup -> 600 unit price * 2 = 1200
        laborHours: 0,
        laborRate: 0,
      },
      {
        itemType: 'LABOR' as const,
        description: 'Brake Fitment Labor',
        quantity: 1,
        unitCost: 0,
        markupPct: 0,
        laborHours: 2, // 2 hours
        laborRate: 650.0, // R650/hr -> 1300
      },
    ];

    const result = quotationService.calculateTotals(items, 15.0, 100.0);

    expect(result.partsSubtotal).toBe(1200.0);
    expect(result.laborSubtotal).toBe(1300.0);
    // Net: 1200 + 1300 - 100 discount = 2400
    // VAT (15%): 2400 * 0.15 = 360
    expect(result.taxAmount).toBe(360.0);
    // Grand total: 2400 + 360 = 2760
    expect(result.grandTotal).toBe(2760.0);
  });

  it('creates a quotation in DRAFT status linked to customer and vehicle', async () => {
    const quote = await quotationService.createQuotation(APEX_BUSINESS_ID, {
      customerId: SARAH_CUSTOMER_ID,
      vehicleId: BMW_VEHICLE_ID,
      notes: 'Test Quote Execution',
      validUntilDays: 14,
      taxRate: 15.0,
      discountAmount: 0,
      items: [
        {
          itemType: 'PART',
          description: 'Synthetic Oil Filter',
          quantity: 1,
          unitCost: 100,
          markupPct: 25,
          laborHours: 0,
          laborRate: 0,
        },
      ],
    });

    expect(quote.id).toBeDefined();
    expect(quote.status).toBe('DRAFT');
    expect(quote.businessId).toBe(APEX_BUSINESS_ID);
    expect(quote.partsSubtotal).toBe(125.0);
    expect(quote.grandTotal).toBe(143.75); // 125 * 1.15
  });

  it('transitions quotation through valid lifecycle: DRAFT -> SENT -> APPROVED', async () => {
    const quote = await quotationService.createQuotation(APEX_BUSINESS_ID, {
      customerId: SARAH_CUSTOMER_ID,
      vehicleId: BMW_VEHICLE_ID,
      items: [
        {
          itemType: 'PART',
          description: 'Air Filter',
          quantity: 1,
          unitCost: 200,
          markupPct: 25,
          laborHours: 0,
          laborRate: 0,
        },
      ],
    });

    // 1. Send quote
    const sentQuote = await quotationService.sendQuotation(quote.id, APEX_BUSINESS_ID);
    expect(sentQuote.status).toBe('SENT');
    expect(sentQuote.sentAt).toBeDefined();

    // 2. Approve quote
    const { quotation: approvedQuote, orderId } = await quotationService.approveQuotation(quote.id, APEX_BUSINESS_ID);
    expect(approvedQuote.status).toBe('APPROVED');
    expect(approvedQuote.approvedAt).toBeDefined();
    expect(orderId).toBeDefined();

    // Confirm order was created in DB
    const order = db.orders.find((o) => o.id === orderId);
    expect(order).toBeDefined();
    expect(order?.quotationId).toBe(quote.id);
    expect(order?.status).toBe('PENDING');
  });

  it('strictly rejects illegal transition: APPROVED -> DRAFT', async () => {
    // Find an existing approved quote
    const approvedQuote = db.quotations.find((q) => q.status === 'APPROVED');
    expect(approvedQuote).toBeDefined();

    expect(() => {
      quotationService.assertValidTransition(approvedQuote!.status, 'DRAFT');
    }).toThrowError(DomainError);

    try {
      quotationService.assertValidTransition(approvedQuote!.status, 'DRAFT');
    } catch (err: any) {
      expect(err.code).toBe('INVALID_STATE_TRANSITION');
      expect(err.status).toBe(409);
    }
  });

  it('prohibits direct approval from DRAFT without sending first', async () => {
    const draftQuote = await quotationService.createQuotation(APEX_BUSINESS_ID, {
      customerId: SARAH_CUSTOMER_ID,
      vehicleId: BMW_VEHICLE_ID,
      items: [
        {
          itemType: 'LABOR',
          description: 'Diagnostic Scan',
          quantity: 1,
          laborHours: 1,
          laborRate: 450,
          unitCost: 0,
          markupPct: 0,
        },
      ],
    });

    await expect(quotationService.approveQuotation(draftQuote.id, APEX_BUSINESS_ID)).rejects.toThrowError(DomainError);
  });
});
