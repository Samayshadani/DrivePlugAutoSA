import { NextRequest } from 'next/server';
import { getTenantContext } from '@/lib/domain/auth/tenant-context';
import { customerService } from '@/lib/domain/customers/customer.service';
import { vehicleService } from '@/lib/domain/vehicles/vehicle.service';
import { updateCustomerSchema } from '@/lib/domain/validation/customer.schema';
import { apiSuccess } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tenant = await getTenantContext(req, 'STAFF');
    const customer = await customerService.getCustomerById(params.id, tenant.businessId);
    const vehicles = await vehicleService.getVehicles(tenant.businessId, customer.id);

    return apiSuccess({
      ...customer,
      vehicles,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tenant = await getTenantContext(req, 'STAFF');
    const body = await req.json();
    const validated = updateCustomerSchema.parse(body);

    const customer = await customerService.updateCustomer(params.id, tenant.businessId, validated);
    return apiSuccess(customer);
  } catch (error) {
    return handleApiError(error);
  }
}
