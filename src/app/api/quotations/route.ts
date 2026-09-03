import { NextRequest } from 'next/server';
import { getTenantContext } from '@/lib/domain/auth/tenant-context';
import { quotationService } from '@/lib/domain/quotations/quotation.service';
import { createQuotationSchema } from '@/lib/domain/validation/quotation.schema';
import { QuotationStatus } from '@/lib/domain/types';
import { apiSuccess } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const tenant = await getTenantContext(req, 'STAFF');
    const { searchParams } = new URL(req.url);
    const status = (searchParams.get('status') as QuotationStatus) || undefined;

    const quotations = await quotationService.listQuotations(tenant.businessId, status);
    return apiSuccess(quotations, 200, { totalCount: quotations.length });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenant = await getTenantContext(req, 'STAFF');
    const body = await req.json();
    const validated = createQuotationSchema.parse(body);

    const quotation = await quotationService.createQuotation(tenant.businessId, validated, tenant.userId);
    return apiSuccess(quotation, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
