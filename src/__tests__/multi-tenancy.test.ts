import { describe, it, expect } from 'vitest';
import { customerService } from '@/lib/domain/customers/customer.service';
import { vehicleService } from '@/lib/domain/vehicles/vehicle.service';
import { quotationService } from '@/lib/domain/quotations/quotation.service';
import { ordersService } from '@/lib/domain/orders/orders.service';
import { getTenantContext, checkRole } from '@/lib/domain/auth/tenant-context';
import { NextRequest } from 'next/server';
import { DomainError } from '@/lib/api/error-handler';

describe('Multi-Tenant Isolation & Authorization', () => {
  const APEX_TENANT_A = '11111111-1111-1111-1111-111111111111';
  const RIVONIA_TENANT_B = '22222222-2222-2222-2222-222222222222';

  it('ensures Workshop A customer queries never leak Workshop B records', async () => {
    const apexCustomers = await customerService.getCustomers(APEX_TENANT_A);
    const rivoniaCustomers = await customerService.getCustomers(RIVONIA_TENANT_B);

    expect(apexCustomers.length).toBeGreaterThan(0);
    expect(rivoniaCustomers.length).toBeGreaterThan(0);

    // Assert disjoint sets
    const apexIds = new Set(apexCustomers.map((c) => c.id));
    for (const bCustomer of rivoniaCustomers) {
      expect(apexIds.has(bCustomer.id)).toBe(false);
      expect(bCustomer.businessId).toBe(RIVONIA_TENANT_B);
    }
  });

  it('prevents Workshop A from reading Workshop B customer by ID', async () => {
    // Pick a customer belonging exclusively to Rivonia (Tenant B)
    const rivoniaCustomer = (await customerService.getCustomers(RIVONIA_TENANT_B))[0];
    expect(rivoniaCustomer).toBeDefined();

    // Attempt to access via Apex (Tenant A) context
    await expect(customerService.getCustomerById(rivoniaCustomer.id, APEX_TENANT_A)).rejects.toThrowError(DomainError);

    try {
      await customerService.getCustomerById(rivoniaCustomer.id, APEX_TENANT_A);
    } catch (err: any) {
      expect(err.code).toBe('NOT_FOUND');
      expect(err.status).toBe(404);
    }
  });

  it('prevents Workshop A from updating Workshop B customer data', async () => {
    const rivoniaCustomer = (await customerService.getCustomers(RIVONIA_TENANT_B))[0];

    await expect(
      customerService.updateCustomer(rivoniaCustomer.id, APEX_TENANT_A, {
        firstName: 'Hacked Name',
      })
    ).rejects.toThrowError(DomainError);
  });

  it('ensures Workshop A cannot view or access Workshop B quotations', async () => {
    const rivoniaQuotes = await quotationService.listQuotations(RIVONIA_TENANT_B);
    expect(rivoniaQuotes.length).toBeGreaterThan(0);

    const bQuote = rivoniaQuotes[0];

    // Attempt read under Tenant A
    await expect(quotationService.getQuotationById(bQuote.id, APEX_TENANT_A)).rejects.toThrowError(DomainError);
  });

  it('ensures Workshop A cannot transition or approve Workshop B quotations', async () => {
    const rivoniaQuotes = await quotationService.listQuotations(RIVONIA_TENANT_B);
    const bQuote = rivoniaQuotes[0];

    await expect(quotationService.sendQuotation(bQuote.id, APEX_TENANT_A)).rejects.toThrowError(DomainError);
    await expect(quotationService.approveQuotation(bQuote.id, APEX_TENANT_A)).rejects.toThrowError(DomainError);
  });

  it('enforces RBAC role hierarchy correctly', () => {
    expect(checkRole('OWNER', 'STAFF')).toBe(true);
    expect(checkRole('OWNER', 'ADMIN')).toBe(true);
    expect(checkRole('ADMIN', 'MANAGER')).toBe(true);
    expect(checkRole('MANAGER', 'STAFF')).toBe(true);

    // Lower roles cannot perform higher actions
    expect(checkRole('STAFF', 'MANAGER')).toBe(false);
    expect(checkRole('STAFF', 'ADMIN')).toBe(false);
    expect(checkRole('MANAGER', 'OWNER')).toBe(false);
  });

  it('rejects unauthenticated requests targeting unknown tenant IDs', async () => {
    const req = new NextRequest('http://localhost:3000/api/customers', {
      headers: {
        'x-business-id': '99999999-9999-9999-9999-999999999999',
      },
    });

    await expect(getTenantContext(req)).rejects.toThrowError(DomainError);
  });
});
