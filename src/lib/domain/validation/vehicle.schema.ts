import { z } from 'zod';

export const createVehicleSchema = z.object({
  customerId: z.string().uuid('Invalid customer UUID'),
  vin: z
    .string()
    .min(11, 'VIN must be at least 11 characters')
    .max(17, 'VIN cannot exceed 17 characters')
    .toUpperCase(),
  licensePlate: z.string().min(1, 'License plate is required').max(20).toUpperCase(),
  make: z.string().min(1, 'Vehicle make is required').max(50),
  model: z.string().min(1, 'Vehicle model is required').max(50),
  year: z
    .number()
    .int()
    .min(1950, 'Year must be after 1950')
    .max(new Date().getFullYear() + 2, 'Year cannot be in the distant future'),
  mileage: z.number().int().min(0, 'Mileage cannot be negative').default(0),
  engineCode: z.string().max(50).optional().or(z.literal('')),
  transmission: z.enum(['MANUAL', 'AUTOMATIC', 'DSG', 'CVT', 'OTHER']).optional(),
});

export const updateVehicleSchema = createVehicleSchema.partial();

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
