import { NextRequest } from 'next/server';
import { getTenantContext } from '@/lib/domain/auth/tenant-context';
import { quotationService } from '@/lib/domain/quotations/quotation.service';
import { apiSuccess } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tenant = await getTenantContext(req, 'STAFF');
    const quotation = await quotationService.getQuotationById(params.id, tenant.businessId);
    return apiSuccess(quotation);
  } catch (error) {
    return handleApiError(error);
  }
}
