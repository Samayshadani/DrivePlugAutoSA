import { NextRequest } from 'next/server';
import { partsService } from '@/lib/domain/parts/parts.service';
import { apiSuccess } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supplierParts = await partsService.getSupplierParts(params.id);
    return apiSuccess(supplierParts, 200, { totalCount: supplierParts.length });
  } catch (error) {
    return handleApiError(error);
  }
}
