import { NextRequest } from 'next/server';
import { partsService } from '@/lib/domain/parts/parts.service';
import { apiSuccess } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || undefined;
    const category = searchParams.get('category') || undefined;

    const parts = await partsService.searchParts(q, category);
    return apiSuccess(parts, 200, { totalCount: parts.length });
  } catch (error) {
    return handleApiError(error);
  }
}
