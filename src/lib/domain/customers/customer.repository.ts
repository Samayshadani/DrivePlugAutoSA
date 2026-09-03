import { db } from '@/lib/db/store';
import { Customer } from '../types';
import { CreateCustomerInput, UpdateCustomerInput } from '../validation/customer.schema';
import crypto from 'crypto';

export class CustomerRepository {
  async listByBusinessId(businessId: string, search?: string): Promise<Customer[]> {
    let results = db.customers.filter((c) => c.businessId === businessId);
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(
        (c) =>
          c.firstName.toLowerCase().includes(q) ||
          c.lastName.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.email && c.email.toLowerCase().includes(q))
      );
    }
    return results;
  }

  async findById(id: string, businessId: string): Promise<Customer | null> {
    const customer = db.customers.find((c) => c.id === id && c.businessId === businessId);
    return customer || null;
  }

  async create(businessId: string, input: CreateCustomerInput): Promise<Customer> {
    const newCustomer: Customer = {
      id: crypto.randomUUID(),
      businessId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email || undefined,
      phone: input.phone,
      idNumber: input.idNumber || undefined,
      address: input.address || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.customers.push(newCustomer);
    return newCustomer;
  }

  async update(id: string, businessId: string, input: UpdateCustomerInput): Promise<Customer | null> {
    const index = db.customers.findIndex((c) => c.id === id && c.businessId === businessId);
    if (index === -1) return null;

    const existing = db.customers[index];
    const updated: Customer = {
      ...existing,
      ...input,
      email: input.email !== undefined ? input.email || undefined : existing.email,
      idNumber: input.idNumber !== undefined ? input.idNumber || undefined : existing.idNumber,
      address: input.address !== undefined ? input.address || undefined : existing.address,
      updatedAt: new Date().toISOString(),
    };
    db.customers[index] = updated;
    return updated;
  }

  async delete(id: string, businessId: string): Promise<boolean> {
    const index = db.customers.findIndex((c) => c.id === id && c.businessId === businessId);
    if (index === -1) return false;
    db.customers.splice(index, 1);
    return true;
  }
}

export const customerRepository = new CustomerRepository();
