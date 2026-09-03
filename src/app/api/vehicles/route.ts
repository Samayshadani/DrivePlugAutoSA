import { NextRequest } from 'next/server';
import { getTenantContext } from '@/lib/domain/auth/tenant-context';
import { vehicleService } from '@/lib/domain/vehicles/vehicle.service';
import { createVehicleSchema } from '@/lib/domain/validation/vehicle.schema';
import { apiSuccess } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const tenant = await getTenantContext(req, 'STAFF');
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId') || undefined;

    const vehicles = await vehicleService.getVehicles(tenant.businessId, customerId);
    return apiSuccess(vehicles, 200, { totalCount: vehicles.length });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenant = await getTenantContext(req, 'STAFF');
    const body = await req.json();
    const validated = createVehicleSchema.parse(body);

    const vehicle = await vehicleService.createVehicle(tenant.businessId, validated);
    return apiSuccess(vehicle, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
