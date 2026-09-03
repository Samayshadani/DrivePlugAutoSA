import { NextRequest } from 'next/server';
import { getTenantContext } from '@/lib/domain/auth/tenant-context';
import { vehicleService } from '@/lib/domain/vehicles/vehicle.service';
import { updateVehicleSchema } from '@/lib/domain/validation/vehicle.schema';
import { apiSuccess } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tenant = await getTenantContext(req, 'STAFF');
    const vehicle = await vehicleService.getVehicleById(params.id, tenant.businessId);
    return apiSuccess(vehicle);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tenant = await getTenantContext(req, 'STAFF');
    const body = await req.json();
    const validated = updateVehicleSchema.parse(body);

    const vehicle = await vehicleService.updateVehicle(params.id, tenant.businessId, validated);
    return apiSuccess(vehicle);
  } catch (error) {
    return handleApiError(error);
  }
}
