import { db } from '@/lib/db/store';
import { Order, OrderStatus, Quotation } from '../types';
import crypto from 'crypto';

export class OrdersRepository {
  async listByBusinessId(businessId: string, status?: OrderStatus): Promise<Order[]> {
    let results = db.orders.filter((o) => o.businessId === businessId);
    if (status) {
      results = results.filter((o) => o.status === status);
    }
    return results.map((o) => this.hydrateOrder(o));
  }

  async findById(id: string, businessId: string): Promise<Order | null> {
    const order = db.orders.find((o) => o.id === id && o.businessId === businessId);
    if (!order) return null;
    return this.hydrateOrder(order);
  }

  async findByQuotationId(quotationId: string, businessId: string): Promise<Order | null> {
    const order = db.orders.find((o) => o.quotationId === quotationId && o.businessId === businessId);
    if (!order) return null;
    return this.hydrateOrder(order);
  }

  async createFromQuotation(businessId: string, quote: Quotation): Promise<Order> {
    // Check if order already exists for this quotation
    const existing = await this.findByQuotationId(quote.id, businessId);
    if (existing) return existing;

    const year = new Date().getFullYear();
    const count = (await this.listByBusinessId(businessId)).length + 1;
    const orderNumber = `ORD-${year}-${String(count).padStart(4, '0')}`;
    const now = new Date().toISOString();

    const newOrder: Order = {
      id: crypto.randomUUID(),
      businessId,
      quotationId: quote.id,
      orderNumber,
      status: 'PENDING',
      totalAmount: quote.grandTotal,
      placedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    db.orders.push(newOrder);
    return this.hydrateOrder(newOrder);
  }

  async updateStatus(id: string, businessId: string, status: OrderStatus): Promise<Order | null> {
    const index = db.orders.findIndex((o) => o.id === id && o.businessId === businessId);
    if (index === -1) return null;

    const existing = db.orders[index];
    const now = new Date().toISOString();

    const updated: Order = {
      ...existing,
      status,
      updatedAt: now,
      ...(status === 'FULFILLED' ? { fulfilledAt: now } : {}),
    };

    db.orders[index] = updated;
    return this.hydrateOrder(updated);
  }

  private hydrateOrder(order: Order): Order {
    const quote = db.quotations.find((q) => q.id === order.quotationId);
    return {
      ...order,
      quotation: quote,
    };
  }
}

export const ordersRepository = new OrdersRepository();
