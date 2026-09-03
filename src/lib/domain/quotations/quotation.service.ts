import { quotationRepository } from './quotation.repository';
import { customerRepository } from '../customers/customer.repository';
import { vehicleRepository } from '../vehicles/vehicle.repository';
import { ordersRepository } from '../orders/orders.repository';
import { Quotation, QuotationItem, QuotationStatus } from '../types';
import { CreateQuotationInput, QuotationItemInput } from '../validation/quotation.schema';
import { DomainError } from '@/lib/api/error-handler';
import { notificationManager } from '@/lib/integrations/notifications/notification.manager';

// Allowed state transitions map
const VALID_TRANSITIONS: Record<QuotationStatus, QuotationStatus[]> = {
  DRAFT: ['SENT'],
  SENT: ['APPROVED', 'REJECTED', 'EXPIRED'],
  APPROVED: [], // Final legal contract state - no direct transition to DRAFT allowed
  REJECTED: ['DRAFT'], // Revision / resubmission
  EXPIRED: ['DRAFT'], // Price recalculation
};

export class QuotationService {
  /**
   * Enforces State Machine rules
   */
  assertValidTransition(currentStatus: QuotationStatus, targetStatus: QuotationStatus) {
    if (currentStatus === 'APPROVED' && targetStatus === 'DRAFT') {
      throw new DomainError(
        'INVALID_STATE_TRANSITION',
        "Illegal transition: An 'APPROVED' quotation is a legally binding contract and cannot be reverted to 'DRAFT'. A new quotation revision must be issued.",
        409,
        { currentStatus, targetStatus }
      );
    }

    const allowed = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
      throw new DomainError(
        'INVALID_STATE_TRANSITION',
        `Invalid quotation state transition from '${currentStatus}' to '${targetStatus}'. Allowed target states: [${allowed.join(', ')}]`,
        409,
        { currentStatus, targetStatus, allowed }
      );
    }
  }

  /**
   * Deterministic Calculation Engine
   */
  calculateTotals(
    items: QuotationItemInput[],
    taxRate = 15.0,
    discountAmount = 0.0
  ) {
    let partsSubtotal = 0.0;
    let laborSubtotal = 0.0;

    const processedItems: Omit<QuotationItem, 'id' | 'quotationId' | 'createdAt'>[] = items.map((item) => {
      let unitPrice = 0.0;
      let lineTotal = 0.0;

      if (item.itemType === 'PART') {
        const markupMultiplier = 1 + (item.markupPct || 0) / 100;
        unitPrice = Math.round((item.unitCost || 0) * markupMultiplier * 100) / 100;
        lineTotal = Math.round(item.quantity * unitPrice * 100) / 100;
        partsSubtotal += lineTotal;
      } else if (item.itemType === 'LABOR') {
        const laborHours = item.laborHours || 1;
        const laborRate = item.laborRate || 650;
        unitPrice = Math.round(laborHours * laborRate * 100) / 100;
        lineTotal = Math.round(item.quantity * unitPrice * 100) / 100;
        laborSubtotal += lineTotal;
      } else {
        unitPrice = item.unitCost || 0;
        lineTotal = Math.round(item.quantity * unitPrice * 100) / 100;
        partsSubtotal += lineTotal;
      }

      return {
        partId: item.partId || undefined,
        supplierPartId: item.supplierPartId || undefined,
        itemType: item.itemType,
        description: item.description,
        quantity: item.quantity,
        unitCost: item.unitCost || 0,
        markupPct: item.markupPct || 0,
        unitPrice,
        laborHours: item.laborHours || 0,
        laborRate: item.laborRate || 0,
        lineTotal,
      };
    });

    partsSubtotal = Math.round(partsSubtotal * 100) / 100;
    laborSubtotal = Math.round(laborSubtotal * 100) / 100;

    const netSubtotal = Math.max(0, partsSubtotal + laborSubtotal - discountAmount);
    const taxAmount = Math.round(netSubtotal * (taxRate / 100) * 100) / 100;
    const grandTotal = Math.round((netSubtotal + taxAmount) * 100) / 100;

    return {
      processedItems,
      partsSubtotal,
      laborSubtotal,
      taxRate,
      taxAmount,
      discountAmount,
      grandTotal,
    };
  }

  async listQuotations(businessId: string, status?: QuotationStatus): Promise<Quotation[]> {
    return quotationRepository.listByBusinessId(businessId, status);
  }

  async getQuotationById(id: string, businessId: string): Promise<Quotation> {
    const quote = await quotationRepository.findById(id, businessId);
    if (!quote) {
      throw new DomainError('NOT_FOUND', `Quotation with ID ${id} not found in this workshop`, 404);
    }
    return quote;
  }

  async createQuotation(businessId: string, input: CreateQuotationInput, userId?: string): Promise<Quotation> {
    // Assert customer belongs to this business
    const customer = await customerRepository.findById(input.customerId, businessId);
    if (!customer) {
      throw new DomainError('NOT_FOUND', `Customer with ID ${input.customerId} not found`, 404);
    }

    // Assert vehicle belongs to this business and customer
    const vehicle = await vehicleRepository.findById(input.vehicleId, businessId);
    if (!vehicle) {
      throw new DomainError('NOT_FOUND', `Vehicle with ID ${input.vehicleId} not found`, 404);
    }
    if (vehicle.customerId !== customer.id) {
      throw new DomainError(
        'BAD_REQUEST',
        `Vehicle (${vehicle.licensePlate}) is not registered to Customer (${customer.firstName} ${customer.lastName})`,
        400
      );
    }

    const { processedItems, partsSubtotal, laborSubtotal, taxRate, taxAmount, discountAmount, grandTotal } =
      this.calculateTotals(input.items, input.taxRate, input.discountAmount);

    const year = new Date().getFullYear();
    const count = (await quotationRepository.listByBusinessId(businessId)).length + 1;
    const quotationNumber = `QT-${year}-${String(count).padStart(4, '0')}`;

    const validUntil = new Date(Date.now() + (input.validUntilDays || 14) * 24 * 60 * 60 * 1000).toISOString();

    return quotationRepository.create(
      businessId,
      {
        businessId,
        quotationNumber,
        customerId: input.customerId,
        vehicleId: input.vehicleId,
        status: 'DRAFT',
        partsSubtotal,
        laborSubtotal,
        taxRate,
        taxAmount,
        discountAmount,
        grandTotal,
        notes: input.notes,
        validUntil,
        createdBy: userId,
      },
      processedItems
    );
  }

  async sendQuotation(id: string, businessId: string): Promise<Quotation> {
    const quote = await this.getQuotationById(id, businessId);
    this.assertValidTransition(quote.status, 'SENT');

    const updated = await quotationRepository.updateStatus(id, businessId, 'SENT', 'sentAt');
    if (!updated) {
      throw new DomainError('NOT_FOUND', `Quotation with ID ${id} not found`, 404);
    }

    // Dispatch external notification adapter (WhatsApp/SMS)
    if (quote.customer?.phone) {
      await notificationManager.notifyQuoteSent({
        recipientPhone: quote.customer.phone,
        recipientEmail: quote.customer.email,
        recipientName: `${quote.customer.firstName} ${quote.customer.lastName}`,
        template: 'QUOTE_SENT',
        variables: {
          quoteNumber: quote.quotationNumber,
          grandTotal: quote.grandTotal,
          vehicle: `${quote.vehicle?.make} ${quote.vehicle?.model}`,
        },
      });
    }

    return updated;
  }

  async approveQuotation(id: string, businessId: string): Promise<{ quotation: Quotation; orderId: string }> {
    const quote = await this.getQuotationById(id, businessId);
    this.assertValidTransition(quote.status, 'APPROVED');

    const updated = await quotationRepository.updateStatus(id, businessId, 'APPROVED', 'approvedAt');
    if (!updated) {
      throw new DomainError('NOT_FOUND', `Quotation with ID ${id} not found`, 404);
    }

    // Auto-generate Procurement Order from Approved Quotation
    const order = await ordersRepository.createFromQuotation(businessId, updated);

    // Notify customer and workshop
    if (quote.customer?.phone) {
      await notificationManager.notifyQuoteApproved({
        recipientPhone: quote.customer.phone,
        recipientEmail: quote.customer.email,
        recipientName: `${quote.customer.firstName} ${quote.customer.lastName}`,
        template: 'QUOTE_APPROVED',
        variables: {
          quoteNumber: quote.quotationNumber,
          orderNumber: order.orderNumber,
          grandTotal: quote.grandTotal,
        },
      });
    }

    return { quotation: updated, orderId: order.id };
  }

  async rejectQuotation(id: string, businessId: string, reason: string): Promise<Quotation> {
    const quote = await this.getQuotationById(id, businessId);
    this.assertValidTransition(quote.status, 'REJECTED');

    const updated = await quotationRepository.updateStatus(id, businessId, 'REJECTED', 'rejectedAt');
    if (!updated) {
      throw new DomainError('NOT_FOUND', `Quotation with ID ${id} not found`, 404);
    }
    return updated;
  }
}

export const quotationService = new QuotationService();
