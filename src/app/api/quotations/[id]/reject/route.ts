import { NextRequest } from 'next/server';
import { getTenantContext } from '@/lib/domain/auth/tenant-context';
import { quotationService } from '@/lib/domain/quotations/quotation.service';
import { rejectQuotationSchema } from '@/lib/domain/validation/quotation.schema';
import { apiSuccess } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tenant = await getTenantContext(req, 'STAFF');
    const body = await req.json();
    const validated = rejectQuotationSchema.parse(body);

    const quotation = await quotationService.rejectQuotation(params.id, tenant.businessId, validated.reason);
    return apiSuccess(quotation);
  } catch (error) {
    return handleApiError(error);
  }
}
