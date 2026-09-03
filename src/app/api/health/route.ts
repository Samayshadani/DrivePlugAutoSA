import { apiSuccess } from '@/lib/api/response';

export async function GET() {
  return apiSuccess({
    status: 'healthy',
    service: 'DrivePlugAutoSA Modular Monolith',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
}
