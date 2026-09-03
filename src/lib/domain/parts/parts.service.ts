import { partsRepository, PartWithSupplierOffers } from './parts.repository';
import { Supplier, SupplierPart } from '../types';
import { DomainError } from '@/lib/api/error-handler';

export class PartsService {
  async searchParts(query?: string, category?: string): Promise<PartWithSupplierOffers[]> {
    return partsRepository.search(query, category);
  }

  async getPartById(id: string): Promise<PartWithSupplierOffers> {
    const part = await partsRepository.findById(id);
    if (!part) {
      throw new DomainError('NOT_FOUND', `Part with ID ${id} not found in master catalogue`, 404);
    }
    return part;
  }

  async listSuppliers(): Promise<Supplier[]> {
    return partsRepository.getSuppliers();
  }

  async getSupplierParts(supplierId: string): Promise<SupplierPart[]> {
    const suppliers = await partsRepository.getSuppliers();
    const supplier = suppliers.find((s) => s.id === supplierId);
    if (!supplier) {
      throw new DomainError('NOT_FOUND', `Supplier with ID ${supplierId} not found`, 404);
    }
    return partsRepository.getSupplierParts(supplierId);
  }
}

export const partsService = new PartsService();
