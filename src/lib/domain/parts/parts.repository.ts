import { db } from '@/lib/db/store';
import { Part, Supplier, SupplierPart } from '../types';

export interface PartWithSupplierOffers extends Part {
  supplierOffers: Array<
    SupplierPart & {
      supplierName: string;
      supplierCode: string;
    }
  >;
}

export class PartsRepository {
  async search(query?: string, category?: string): Promise<PartWithSupplierOffers[]> {
    let matchedParts = [...db.parts];

    if (query) {
      const q = query.toLowerCase().trim();
      matchedParts = matchedParts.filter(
        (p) =>
          p.partNumber.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.oemReference && p.oemReference.toLowerCase().includes(q))
      );
    }

    if (category) {
      matchedParts = matchedParts.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }

    // Attach supplier offers
    return matchedParts.map((part) => {
      const offers = db.supplierParts
        .filter((sp) => sp.partId === part.id)
        .map((sp) => {
          const supplier = db.suppliers.find((s) => s.id === sp.supplierId);
          return {
            ...sp,
            supplierName: supplier?.name || 'Unknown Wholesaler',
            supplierCode: supplier?.code || 'UNK',
          };
        })
        .sort((a, b) => a.costPrice - b.costPrice); // Sort by lowest cost price first

      return {
        ...part,
        supplierOffers: offers,
      };
    });
  }

  async findById(id: string): Promise<PartWithSupplierOffers | null> {
    const part = db.parts.find((p) => p.id === id);
    if (!part) return null;

    const offers = db.supplierParts
      .filter((sp) => sp.partId === part.id)
      .map((sp) => {
        const supplier = db.suppliers.find((s) => s.id === sp.supplierId);
        return {
          ...sp,
          supplierName: supplier?.name || 'Unknown Wholesaler',
          supplierCode: supplier?.code || 'UNK',
        };
      })
      .sort((a, b) => a.costPrice - b.costPrice);

    return {
      ...part,
      supplierOffers: offers,
    };
  }

  async getSuppliers(): Promise<Supplier[]> {
    return db.suppliers.filter((s) => s.isActive);
  }

  async getSupplierParts(supplierId: string): Promise<SupplierPart[]> {
    return db.supplierParts.filter((sp) => sp.supplierId === supplierId);
  }
}

export const partsRepository = new PartsRepository();
