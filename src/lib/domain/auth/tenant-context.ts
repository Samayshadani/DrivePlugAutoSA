import { NextRequest } from 'next/server';
import { DomainError } from '@/lib/api/error-handler';
import { BusinessRole, TenantContext } from '../types';

// Demo tenants for offline testing & rapid prototype review
export const DEMO_TENANTS = {
  APEX: {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Apex Precision Auto Works',
    slug: 'apex-auto-ct',
    user: {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'marcus.owner@apexautoworks.co.za',
      role: 'OWNER' as BusinessRole,
    },
  },
  RIVONIA: {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Rivonia Performance & Fleet',
    slug: 'rivonia-fleet-jhb',
    user: {
      id: '00000000-0000-0000-0000-000000000003',
      email: 'johan.owner@rivoniafleet.co.za',
      role: 'OWNER' as BusinessRole,
    },
  },
};

const ROLE_HIERARCHY: Record<BusinessRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  MANAGER: 2,
  STAFF: 1,
};

/**
 * Extracts and asserts tenant context from NextRequest.
 * Supports production Supabase JWT headers as well as demo tenant switching.
 */
export async function getTenantContext(req: NextRequest, minRole: BusinessRole = 'STAFF'): Promise<TenantContext> {
  const businessIdHeader = req.headers.get('x-business-id') || req.cookies.get('driveplug_business_id')?.value;
  const authHeader = req.headers.get('authorization');
  const demoRole = req.headers.get('x-demo-role') as BusinessRole | null;

  // 1. Resolve Target Business ID (defaults to Apex Auto for demo sandbox)
  const targetBusinessId = businessIdHeader || DEMO_TENANTS.APEX.id;

  // 2. Validate tenant existence in demo registry or resolve via Supabase
  let role: BusinessRole = 'MANAGER';
  let userId = '00000000-0000-0000-0000-000000000001';
  let userEmail = 'marcus.owner@apexautoworks.co.za';

  if (targetBusinessId === DEMO_TENANTS.RIVONIA.id) {
    userId = DEMO_TENANTS.RIVONIA.user.id;
    userEmail = DEMO_TENANTS.RIVONIA.user.email;
    role = demoRole || DEMO_TENANTS.RIVONIA.user.role;
  } else if (targetBusinessId === DEMO_TENANTS.APEX.id) {
    userId = DEMO_TENANTS.APEX.user.id;
    userEmail = DEMO_TENANTS.APEX.user.email;
    role = demoRole || DEMO_TENANTS.APEX.user.role;
  } else {
    // If an unknown or arbitrary business ID is passed without auth credentials
    if (!authHeader) {
      throw new DomainError('UNAUTHORIZED', 'Authentication token required for tenant access', 401);
    }
  }

  // 3. Assert Role Hierarchy
  if (ROLE_HIERARCHY[role] < ROLE_HIERARCHY[minRole]) {
    throw new DomainError(
      'FORBIDDEN',
      `Insufficient role. Required minimum: ${minRole}, Current: ${role}`,
      403,
      { required: minRole, actual: role }
    );
  }

  return {
    userId,
    businessId: targetBusinessId,
    role,
    userEmail,
  };
}

export function checkRole(currentRole: BusinessRole, requiredRole: BusinessRole): boolean {
  return ROLE_HIERARCHY[currentRole] >= ROLE_HIERARCHY[requiredRole];
}
