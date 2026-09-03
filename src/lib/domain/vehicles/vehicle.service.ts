import { vehicleRepository } from './vehicle.repository';
import { customerRepository } from '../customers/customer.repository';
import { Vehicle } from '../types';
import { CreateVehicleInput, UpdateVehicleInput } from '../validation/vehicle.schema';
import { DomainError } from '@/lib/api/error-handler';

export class VehicleService {
  async getVehicles(businessId: string, customerId?: string): Promise<Vehicle[]> {
    return vehicleRepository.listByBusinessId(businessId, customerId);
  }

  async getVehicleById(id: string, businessId: string): Promise<Vehicle> {
    const vehicle = await vehicleRepository.findById(id, businessId);
    if (!vehicle) {
      throw new DomainError('NOT_FOUND', `Vehicle with ID ${id} not found in this workshop`, 404);
    }
    return vehicle;
  }

  async createVehicle(businessId: string, input: CreateVehicleInput): Promise<Vehicle> {
    // Assert customer belongs to this business
    const customer = await customerRepository.findById(input.customerId, businessId);
    if (!customer) {
      throw new DomainError('NOT_FOUND', `Customer with ID ${input.customerId} not found in this workshop`, 404);
    }

    // Check VIN conflict within this business
    const existingVin = await vehicleRepository.findByVin(input.vin, businessId);
    if (existingVin) {
      throw new DomainError('CONFLICT', `A vehicle with VIN ${input.vin} is already registered in this workshop`, 409);
    }

    return vehicleRepository.create(businessId, input);
  }

  async updateVehicle(id: string, businessId: string, input: UpdateVehicleInput): Promise<Vehicle> {
    await this.getVehicleById(id, businessId);
    const updated = await vehicleRepository.update(id, businessId, input);
    if (!updated) {
      throw new DomainError('NOT_FOUND', `Vehicle with ID ${id} not found`, 404);
    }
    return updated;
  }
}

export const vehicleService = new VehicleService();
