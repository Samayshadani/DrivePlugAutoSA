// ============================================================================
// DrivePlugAutoSA - Core Domain Types & Models
// ============================================================================

export type BusinessRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF';

export type BusinessType = 'WORKSHOP' | 'DEALERSHIP' | 'FLEET';

export type QuotationStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PARTS_ORDERED' | 'IN_PROGRESS' | 'FULFILLED' | 'CANCELLED';

export type ItemType = 'PART' | 'LABOR' | 'MISC';

export type AvailabilityStatus = 'IN_STOCK' | 'LOW_STOCK' | 'ORDER_ON_DEMAND' | 'OUT_OF_STOCK';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  type: BusinessType;
  taxNumber?: string;
  email: string;
  phone?: string;
  currency: string;
  address?: {
    street?: string;
    city?: string;
    postalCode?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BusinessMember {
  id: string;
  businessId: string;
  userId: string;
  role: BusinessRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkshopConfig {
  id: string;
  businessId: string;
  hourlyLaborRate: number;
  defaultPartsMarkupPct: number;
  bayCount: number;
}

export interface Customer {
  id: string;
  businessId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  idNumber?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  businessId: string;
  customerId: string;
  vin: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  engineCode?: string;
  transmission?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  code: string;
  contactEmail: string;
  phone?: string;
  leadTimeRating: number;
  apiAdapter: string;
  isActive: boolean;
}

export interface Part {
  id: string;
  partNumber: string;
  name: string;
  category: string;
  description?: string;
  oemReference?: string;
  isOem: boolean;
}

export interface SupplierPart {
  id: string;
  supplierId: string;
  partId: string;
  supplierSku: string;
  costPrice: number;
  currency: string;
  stockQuantity: number;
  availability: AvailabilityStatus;
  leadTimeDays: number;
  lastUpdatedAt: string;
  supplier?: Supplier;
}

export interface QuotationItem {
  id: string;
  quotationId: string;
  partId?: string;
  supplierPartId?: string;
  itemType: ItemType;
  description: string;
  quantity: number;
  unitCost: number;
  markupPct: number;
  unitPrice: number;
  laborHours: number;
  laborRate: number;
  lineTotal: number;
  createdAt: string;
}

export interface Quotation {
  id: string;
  businessId: string;
  quotationNumber: string;
  customerId: string;
  vehicleId: string;
  status: QuotationStatus;
  partsSubtotal: number;
  laborSubtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  notes?: string;
  validUntil: string;
  sentAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  items?: QuotationItem[];
  customer?: Customer;
  vehicle?: Vehicle;
}

export interface Order {
  id: string;
  businessId: string;
  quotationId: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  placedAt: string;
  fulfilledAt?: string;
  createdAt: string;
  updatedAt: string;
  quotation?: Quotation;
}

export interface TenantContext {
  userId: string;
  businessId: string;
  role: BusinessRole;
  userEmail: string;
}
