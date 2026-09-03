import { NextRequest } from 'next/server';
import { getTenantContext } from '@/lib/domain/auth/tenant-context';
import { customerService } from '@/lib/domain/customers/customer.service';
import { createCustomerSchema } from '@/lib/domain/validation/customer.schema';
import { apiSuccess } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const tenant = await getTenantContext(req, 'STAFF');
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;

    const customers = await customerService.getCustomers(tenant.businessId, search);
    return apiSuccess(customers, 200, { totalCount: customers.length });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenant = await getTenantContext(req, 'STAFF');
    const body = await req.json();
    const validated = createCustomerSchema.parse(body);

    const customer = await customerService.createCustomer(tenant.businessId, validated);
    return apiSuccess(customer, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
