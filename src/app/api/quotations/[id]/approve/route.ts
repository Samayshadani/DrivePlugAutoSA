import { NextRequest } from 'next/server';
import { getTenantContext } from '@/lib/domain/auth/tenant-context';
import { quotationService } from '@/lib/domain/quotations/quotation.service';
import { apiSuccess } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tenant = await getTenantContext(req, 'MANAGER');
    const result = await quotationService.approveQuotation(params.id, tenant.businessId);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
