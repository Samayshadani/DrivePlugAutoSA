-- ============================================================================
-- DrivePlugAutoSA - Initial PostgreSQL Schema Migration
-- Version: 20260903_001
-- Engine: PostgreSQL 15+ (Supabase)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Trigger function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- 1. USERS (Identity Profiles)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TRIGGER update_users_modtime
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- ============================================================================
-- 2. BUSINESSES (Tenant Container)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('WORKSHOP', 'DEALERSHIP', 'FLEET')),
    tax_number VARCHAR(50),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    currency VARCHAR(3) DEFAULT 'ZAR' NOT NULL,
    address JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TRIGGER update_businesses_modtime
    BEFORE UPDATE ON public.businesses
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- ============================================================================
-- 3. BUSINESS_MEMBERS (Tenant Membership & RBAC)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.business_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'MANAGER', 'STAFF')),
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT uq_business_member UNIQUE(business_id, user_id)
);

CREATE INDEX idx_business_members_user ON public.business_members(user_id);
CREATE INDEX idx_business_members_business ON public.business_members(business_id);

CREATE TRIGGER update_business_members_modtime
    BEFORE UPDATE ON public.business_members
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- ============================================================================
-- 4. WORKSHOPS (Workshop Specific Configuration)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.workshops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID UNIQUE NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    hourly_labor_rate DECIMAL(10,2) DEFAULT 650.00 NOT NULL CHECK (hourly_labor_rate >= 0),
    default_parts_markup_pct DECIMAL(5,2) DEFAULT 25.00 NOT NULL CHECK (default_parts_markup_pct >= 0),
    bay_count INTEGER DEFAULT 4 CHECK (bay_count > 0),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================================
-- 5. DEALERSHIPS (Dealership Specific Configuration)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.dealerships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID UNIQUE NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    brand_franchises TEXT[] DEFAULT '{}'::text[],
    dealer_code VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================================
-- 6. CUSTOMERS (Tenant-Owned)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(30) NOT NULL,
    id_number VARCHAR(50),
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_customers_business ON public.customers(business_id);
CREATE INDEX idx_customers_phone ON public.customers(business_id, phone);

CREATE TRIGGER update_customers_modtime
    BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- ============================================================================
-- 7. VEHICLES (Tenant-Owned)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    vin VARCHAR(17) NOT NULL,
    license_plate VARCHAR(20) NOT NULL,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL CHECK (year BETWEEN 1950 AND 2050),
    mileage INTEGER DEFAULT 0 CHECK (mileage >= 0),
    engine_code VARCHAR(50),
    transmission VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_vehicles_business ON public.vehicles(business_id);
CREATE INDEX idx_vehicles_vin ON public.vehicles(business_id, vin);
CREATE INDEX idx_vehicles_license ON public.vehicles(business_id, license_plate);
CREATE INDEX idx_vehicles_customer ON public.vehicles(customer_id);

CREATE TRIGGER update_vehicles_modtime
    BEFORE UPDATE ON public.vehicles
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- ============================================================================
-- 8. SUPPLIERS (Global Catalogue of Wholesalers)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    lead_time_rating DECIMAL(3,2) DEFAULT 4.50,
    api_adapter VARCHAR(50) DEFAULT 'MOCK_DISTRIBUTOR',
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================================
-- 9. PARTS (Master Parts Catalogue)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    part_number VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    oem_reference VARCHAR(100),
    is_oem BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_parts_number ON public.parts(part_number);
CREATE INDEX idx_parts_category ON public.parts(category);

-- ============================================================================
-- 10. SUPPLIER_PARTS (Pricing & Inventory Matrix)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.supplier_parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    part_id UUID NOT NULL REFERENCES public.parts(id) ON DELETE CASCADE,
    supplier_sku VARCHAR(100) NOT NULL,
    cost_price DECIMAL(10,2) NOT NULL CHECK (cost_price >= 0),
    currency VARCHAR(3) DEFAULT 'ZAR' NOT NULL,
    stock_quantity INTEGER DEFAULT 0 NOT NULL CHECK (stock_quantity >= 0),
    availability VARCHAR(30) NOT NULL CHECK (availability IN ('IN_STOCK', 'LOW_STOCK', 'ORDER_ON_DEMAND', 'OUT_OF_STOCK')),
    lead_time_days INTEGER DEFAULT 1 NOT NULL CHECK (lead_time_days >= 0),
    last_updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT uq_supplier_part UNIQUE (supplier_id, part_id)
);

CREATE INDEX idx_supplier_parts_part ON public.supplier_parts(part_id, cost_price);
CREATE INDEX idx_supplier_parts_supplier ON public.supplier_parts(supplier_id);

-- ============================================================================
-- 11. QUOTATIONS (Tenant-Owned)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    quotation_number VARCHAR(50) NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
    status VARCHAR(20) DEFAULT 'DRAFT' NOT NULL CHECK (status IN ('DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED')),
    parts_subtotal DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
    labor_subtotal DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 15.00 NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
    grand_total DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
    notes TEXT,
    valid_until TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT uq_business_quotation_number UNIQUE (business_id, quotation_number)
);

CREATE INDEX idx_quotations_business ON public.quotations(business_id);
CREATE INDEX idx_quotations_status ON public.quotations(business_id, status);
CREATE INDEX idx_quotations_customer ON public.quotations(customer_id);
CREATE INDEX idx_quotations_vehicle ON public.quotations(vehicle_id);

CREATE TRIGGER update_quotations_modtime
    BEFORE UPDATE ON public.quotations
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- ============================================================================
-- 12. QUOTATION_ITEMS (Line Items)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.quotation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
    part_id UUID REFERENCES public.parts(id) ON DELETE SET NULL,
    supplier_part_id UUID REFERENCES public.supplier_parts(id) ON DELETE SET NULL,
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('PART', 'LABOR', 'MISC')),
    description VARCHAR(255) NOT NULL,
    quantity DECIMAL(8,2) NOT NULL CHECK (quantity > 0),
    unit_cost DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
    markup_pct DECIMAL(5,2) DEFAULT 0.00 NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    labor_hours DECIMAL(5,2) DEFAULT 0.00,
    labor_rate DECIMAL(10,2) DEFAULT 0.00,
    line_total DECIMAL(10,2) NOT NULL CHECK (line_total >= 0),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_quotation_items_quotation ON public.quotation_items(quotation_id);

-- ============================================================================
-- 13. ORDERS (Tenant-Owned Procurement & Fulfillment)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    quotation_id UUID UNIQUE NOT NULL REFERENCES public.quotations(id) ON DELETE RESTRICT,
    order_number VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' NOT NULL CHECK (status IN ('PENDING', 'CONFIRMED', 'PARTS_ORDERED', 'IN_PROGRESS', 'FULFILLED', 'CANCELLED')),
    total_amount DECIMAL(10,2) NOT NULL,
    placed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    fulfilled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT uq_business_order_number UNIQUE (business_id, order_number)
);

CREATE INDEX idx_orders_business ON public.orders(business_id);
CREATE INDEX idx_orders_status ON public.orders(business_id, status);

CREATE TRIGGER update_orders_modtime
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- ============================================================================
-- 14. AUDIT_LOGS (Tenant-Scanned Security & Mutation Audit)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_audit_logs_lookup ON public.audit_logs(business_id, entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(business_id, created_at);
