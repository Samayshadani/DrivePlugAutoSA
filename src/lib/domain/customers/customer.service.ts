import { customerRepository } from './customer.repository';
import { Customer } from '../types';
import { CreateCustomerInput, UpdateCustomerInput } from '../validation/customer.schema';
import { DomainError } from '@/lib/api/error-handler';

export class CustomerService {
  async getCustomers(businessId: string, search?: string): Promise<Customer[]> {
    return customerRepository.listByBusinessId(businessId, search);
  }

  async getCustomerById(id: string, businessId: string): Promise<Customer> {
    const customer = await customerRepository.findById(id, businessId);
    if (!customer) {
      throw new DomainError('NOT_FOUND', `Customer with ID ${id} not found in this workshop`, 404);
    }
    return customer;
  }

  async createCustomer(businessId: string, input: CreateCustomerInput): Promise<Customer> {
    // Check for duplicate phone within this tenant
    const existing = await customerRepository.listByBusinessId(businessId);
    const duplicate = existing.find((c) => c.phone === input.phone);
    if (duplicate) {
      throw new DomainError('CONFLICT', `A customer with phone number ${input.phone} already exists`, 409);
    }
    return customerRepository.create(businessId, input);
  }

  async updateCustomer(id: string, businessId: string, input: UpdateCustomerInput): Promise<Customer> {
    await this.getCustomerById(id, businessId);
    const updated = await customerRepository.update(id, businessId, input);
    if (!updated) {
      throw new DomainError('NOT_FOUND', `Customer with ID ${id} not found`, 404);
    }
    return updated;
  }
}

export const customerService = new CustomerService();
