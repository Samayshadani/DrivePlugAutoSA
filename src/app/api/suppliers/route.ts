import { NextRequest } from 'next/server';
import { partsService } from '@/lib/domain/parts/parts.service';
import { apiSuccess } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';

export async function GET(_req: NextRequest) {
  try {
    const suppliers = await partsService.listSuppliers();
    return apiSuccess(suppliers, 200, { totalCount: suppliers.length });
  } catch (error) {
    return handleApiError(error);
  }
}
