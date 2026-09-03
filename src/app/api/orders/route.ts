import { NextRequest } from 'next/server';
import { getTenantContext } from '@/lib/domain/auth/tenant-context';
import { ordersService } from '@/lib/domain/orders/orders.service';
import { createOrderSchema } from '@/lib/domain/validation/order.schema';
import { OrderStatus } from '@/lib/domain/types';
import { apiSuccess } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const tenant = await getTenantContext(req, 'STAFF');
    const { searchParams } = new URL(req.url);
    const status = (searchParams.get('status') as OrderStatus) || undefined;

    const orders = await ordersService.listOrders(tenant.businessId, status);
    return apiSuccess(orders, 200, { totalCount: orders.length });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenant = await getTenantContext(req, 'MANAGER');
    const body = await req.json();
    const validated = createOrderSchema.parse(body);

    const order = await ordersService.createOrderFromQuotation(tenant.businessId, validated);
    return apiSuccess(order, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
