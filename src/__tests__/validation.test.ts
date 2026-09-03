import { describe, it, expect } from 'vitest';
import { createCustomerSchema } from '@/lib/domain/validation/customer.schema';
import { createVehicleSchema } from '@/lib/domain/validation/vehicle.schema';
import { createQuotationSchema } from '@/lib/domain/validation/quotation.schema';

describe('Zod Input Validation Schemas', () => {
  it('validates customer creation schema accurately', () => {
    // Valid input
    const valid = createCustomerSchema.safeParse({
      firstName: 'Thabo',
      lastName: 'Mokoena',
      email: 'thabo@example.co.za',
      phone: '+27831112233',
    });
    expect(valid.success).toBe(true);

    // Missing first name
    const missingName = createCustomerSchema.safeParse({
      firstName: '',
      lastName: 'Mokoena',
      phone: '+27831112233',
    });
    expect(missingName.success).toBe(false);

    // Invalid email
    const invalidEmail = createCustomerSchema.safeParse({
      firstName: 'Thabo',
      lastName: 'Mokoena',
      email: 'not-an-email',
      phone: '+27831112233',
    });
    expect(invalidEmail.success).toBe(false);
  });

  it('validates automotive vehicle specifications', () => {
    const valid = createVehicleSchema.safeParse({
      customerId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      vin: 'WBA3A5C50DF289110',
      licensePlate: 'CA 123-456',
      make: 'BMW',
      model: '320i',
      year: 2019,
      mileage: 45000,
    });
    expect(valid.success).toBe(true);

    // Invalid short VIN
    const shortVin = createVehicleSchema.safeParse({
      customerId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      vin: 'SHORT',
      licensePlate: 'CA 123-456',
      make: 'BMW',
      model: '320i',
      year: 2019,
    });
    expect(shortVin.success).toBe(false);

    // Negative mileage
    const negMileage = createVehicleSchema.safeParse({
      customerId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      vin: 'WBA3A5C50DF289110',
      licensePlate: 'CA 123-456',
      make: 'BMW',
      model: '320i',
      year: 2019,
      mileage: -100,
    });
    expect(negMileage.success).toBe(false);
  });

  it('enforces quotation line item presence and positive pricing', () => {
    // Empty line items list
    const emptyItems = createQuotationSchema.safeParse({
      customerId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      vehicleId: 'e28da951-6fb7-4a81-9b16-834928e4e930',
      items: [],
    });
    expect(emptyItems.success).toBe(false);

    // Zero/negative quantity
    const invalidQty = createQuotationSchema.safeParse({
      customerId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      vehicleId: 'e28da951-6fb7-4a81-9b16-834928e4e930',
      items: [
        {
          itemType: 'PART',
          description: 'Brake Disc',
          quantity: 0,
          unitCost: 100,
        },
      ],
    });
    expect(invalidQty.success).toBe(false);
  });
});
