import { db } from '@/lib/db/store';
import { Vehicle } from '../types';
import { CreateVehicleInput, UpdateVehicleInput } from '../validation/vehicle.schema';
import crypto from 'crypto';

export class VehicleRepository {
  async listByBusinessId(businessId: string, customerId?: string): Promise<Vehicle[]> {
    let results = db.vehicles.filter((v) => v.businessId === businessId);
    if (customerId) {
      results = results.filter((v) => v.customerId === customerId);
    }
    return results;
  }

  async findById(id: string, businessId: string): Promise<Vehicle | null> {
    const vehicle = db.vehicles.find((v) => v.id === id && v.businessId === businessId);
    return vehicle || null;
  }

  async findByVin(vin: string, businessId: string): Promise<Vehicle | null> {
    const vehicle = db.vehicles.find(
      (v) => v.vin.toUpperCase() === vin.toUpperCase() && v.businessId === businessId
    );
    return vehicle || null;
  }

  async create(businessId: string, input: CreateVehicleInput): Promise<Vehicle> {
    const newVehicle: Vehicle = {
      id: crypto.randomUUID(),
      businessId,
      customerId: input.customerId,
      vin: input.vin.toUpperCase(),
      licensePlate: input.licensePlate.toUpperCase(),
      make: input.make,
      model: input.model,
      year: input.year,
      mileage: input.mileage,
      engineCode: input.engineCode || undefined,
      transmission: input.transmission || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.vehicles.push(newVehicle);
    return newVehicle;
  }

  async update(id: string, businessId: string, input: UpdateVehicleInput): Promise<Vehicle | null> {
    const index = db.vehicles.findIndex((v) => v.id === id && v.businessId === businessId);
    if (index === -1) return null;

    const existing = db.vehicles[index];
    const updated: Vehicle = {
      ...existing,
      ...input,
      vin: input.vin ? input.vin.toUpperCase() : existing.vin,
      licensePlate: input.licensePlate ? input.licensePlate.toUpperCase() : existing.licensePlate,
      engineCode: input.engineCode !== undefined ? input.engineCode || undefined : existing.engineCode,
      updatedAt: new Date().toISOString(),
    };
    db.vehicles[index] = updated;
    return updated;
  }
}

export const vehicleRepository = new VehicleRepository();
