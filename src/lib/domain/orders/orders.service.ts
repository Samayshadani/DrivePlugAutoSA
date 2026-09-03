import { ordersRepository } from './orders.repository';
import { quotationRepository } from '../quotations/quotation.repository';
import { Order, OrderStatus } from '../types';
import { CreateOrderInput } from '../validation/order.schema';
import { DomainError } from '@/lib/api/error-handler';

export class OrdersService {
  async listOrders(businessId: string, status?: OrderStatus): Promise<Order[]> {
    return ordersRepository.listByBusinessId(businessId, status);
  }

  async getOrderById(id: string, businessId: string): Promise<Order> {
    const order = await ordersRepository.findById(id, businessId);
    if (!order) {
      throw new DomainError('NOT_FOUND', `Order with ID ${id} not found in this workshop`, 404);
    }
    return order;
  }

  async createOrderFromQuotation(businessId: string, input: CreateOrderInput): Promise<Order> {
    const quote = await quotationRepository.findById(input.quotationId, businessId);
    if (!quote) {
      throw new DomainError('NOT_FOUND', `Quotation with ID ${input.quotationId} not found`, 404);
    }

    if (quote.status !== 'APPROVED') {
      throw new DomainError(
        'PRECONDITION_FAILED',
        `Cannot create order for quotation in status '${quote.status}'. Quotation must be 'APPROVED'.`,
        412
      );
    }

    return ordersRepository.createFromQuotation(businessId, quote);
  }

  async updateOrderStatus(id: string, businessId: string, status: OrderStatus): Promise<Order> {
    await this.getOrderById(id, businessId);
    const updated = await ordersRepository.updateStatus(id, businessId, status);
    if (!updated) {
      throw new DomainError('NOT_FOUND', `Order with ID ${id} not found`, 404);
    }
    return updated;
  }
}

export const ordersService = new OrdersService();
