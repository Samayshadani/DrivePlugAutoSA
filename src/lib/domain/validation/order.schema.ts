import { z } from 'zod';

export const createOrderSchema = z.object({
  quotationId: z.string().uuid('Invalid quotation UUID'),
  notes: z.string().max(500).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PARTS_ORDERED', 'IN_PROGRESS', 'FULFILLED', 'CANCELLED']),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
