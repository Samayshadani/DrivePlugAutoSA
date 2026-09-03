import { z } from 'zod';

export const quotationItemSchema = z.object({
  itemType: z.enum(['PART', 'LABOR', 'MISC']),
  partId: z.string().uuid().optional().nullable(),
  supplierPartId: z.string().uuid().optional().nullable(),
  description: z.string().min(1, 'Item description is required').max(255),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unitCost: z.number().min(0, 'Cost price cannot be negative').default(0),
  markupPct: z.number().min(0, 'Markup % cannot be negative').default(0),
  unitPrice: z.number().min(0, 'Unit price cannot be negative').optional(),
  laborHours: z.number().min(0, 'Labor hours cannot be negative').default(0),
  laborRate: z.number().min(0, 'Labor rate cannot be negative').default(0),
});

export const createQuotationSchema = z.object({
  customerId: z.string().uuid('Invalid customer UUID'),
  vehicleId: z.string().uuid('Invalid vehicle UUID'),
  notes: z.string().max(1000).optional(),
  validUntilDays: z.number().int().min(1).max(90).optional().default(14),
  taxRate: z.number().min(0).max(100).optional().default(15.0),
  discountAmount: z.number().min(0).optional().default(0),
  items: z.array(quotationItemSchema).min(1, 'Quotation must have at least one line item'),
});

export const updateQuotationSchema = z.object({
  notes: z.string().max(1000).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  discountAmount: z.number().min(0).optional(),
  items: z.array(quotationItemSchema).optional(),
});

export const rejectQuotationSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required').max(255),
});

export type QuotationItemInput = z.input<typeof quotationItemSchema>;
export type CreateQuotationInput = z.input<typeof createQuotationSchema>;
export type UpdateQuotationInput = z.input<typeof updateQuotationSchema>;
export type RejectQuotationInput = z.infer<typeof rejectQuotationSchema>;
