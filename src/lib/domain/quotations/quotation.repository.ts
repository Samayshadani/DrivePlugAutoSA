import { db } from '@/lib/db/store';
import { Quotation, QuotationItem, QuotationStatus } from '../types';
import crypto from 'crypto';

export class QuotationRepository {
  async listByBusinessId(businessId: string, status?: QuotationStatus): Promise<Quotation[]> {
    let results = db.quotations.filter((q) => q.businessId === businessId);
    if (status) {
      results = results.filter((q) => q.status === status);
    }
    return results.map((q) => this.hydrateQuotation(q));
  }

  async findById(id: string, businessId: string): Promise<Quotation | null> {
    const quote = db.quotations.find((q) => q.id === id && q.businessId === businessId);
    if (!quote) return null;
    return this.hydrateQuotation(quote);
  }

  async create(
    businessId: string,
    data: Omit<Quotation, 'id' | 'createdAt' | 'updatedAt' | 'items'>,
    items: Omit<QuotationItem, 'id' | 'quotationId' | 'createdAt'>[]
  ): Promise<Quotation> {
    const quoteId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newQuote: Quotation = {
      ...data,
      id: quoteId,
      businessId,
      createdAt: now,
      updatedAt: now,
    };
    db.quotations.push(newQuote);

    const newItems: QuotationItem[] = items.map((item) => ({
      ...item,
      id: crypto.randomUUID(),
      quotationId: quoteId,
      createdAt: now,
    }));
    db.quotationItems.push(...newItems);

    return this.hydrateQuotation(newQuote);
  }

  async updateStatus(
    id: string,
    businessId: string,
    status: QuotationStatus,
    timestampField?: 'sentAt' | 'approvedAt' | 'rejectedAt'
  ): Promise<Quotation | null> {
    const index = db.quotations.findIndex((q) => q.id === id && q.businessId === businessId);
    if (index === -1) return null;

    const existing = db.quotations[index];
    const now = new Date().toISOString();

    const updated: Quotation = {
      ...existing,
      status,
      updatedAt: now,
      ...(timestampField ? { [timestampField]: now } : {}),
    };

    db.quotations[index] = updated;
    return this.hydrateQuotation(updated);
  }

  async delete(id: string, businessId: string): Promise<boolean> {
    const index = db.quotations.findIndex((q) => q.id === id && q.businessId === businessId);
    if (index === -1) return false;

    // Delete child items first
    db.quotationItems = db.quotationItems.filter((qi) => qi.quotationId !== id);
    db.quotations.splice(index, 1);
    return true;
  }

  private hydrateQuotation(quote: Quotation): Quotation {
    const items = db.quotationItems.filter((item) => item.quotationId === quote.id);
    const customer = db.customers.find((c) => c.id === quote.customerId);
    const vehicle = db.vehicles.find((v) => v.id === quote.vehicleId);

    return {
      ...quote,
      items,
      customer,
      vehicle,
    };
  }
}

export const quotationRepository = new QuotationRepository();
