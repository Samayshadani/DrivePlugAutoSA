-- ============================================================================
-- DrivePlugAutoSA - Multi-Tenant Seed Data Script
-- Version: 20260903_001
-- Description: Seeds 2 distinct workshops, customers, vehicles, parts,
--              suppliers, supplier pricing matrix, quotations, and orders.
-- ============================================================================

-- Clean existing data if in testing sandbox
TRUNCATE public.audit_logs, public.orders, public.quotation_items, public.quotations, 
         public.supplier_parts, public.parts, public.suppliers, public.vehicles, 
         public.customers, public.dealerships, public.workshops, public.business_members, 
         public.businesses, public.users CASCADE;

-- 1. SEED BUSINESSES (Tenants)
INSERT INTO public.businesses (id, name, slug, type, tax_number, email, phone, currency, address) VALUES
('11111111-1111-1111-1111-111111111111', 'Apex Precision Auto Works', 'apex-auto-ct', 'WORKSHOP', '4980281920', 'service@apexautoworks.co.za', '+27215550100', 'ZAR', '{"street": "14 Marine Drive", "city": "Cape Town", "postal_code": "8001"}'::jsonb),
('22222222-2222-2222-2222-222222222222', 'Rivonia Performance & Fleet', 'rivonia-fleet-jhb', 'WORKSHOP', '4710293847', 'ops@rivoniafleet.co.za', '+27115550200', 'ZAR', '{"street": "88 Rivonia Road", "city": "Johannesburg", "postal_code": "2196"}'::jsonb);

-- 2. SEED USERS & MEMBERSHIPS
-- Dummy auth IDs for demo/testing
INSERT INTO public.users (id, email, full_name, phone) VALUES
('00000000-0000-0000-0000-000000000001', 'marcus.owner@apexautoworks.co.za', 'Marcus Thorne', '+27821110001'),
('00000000-0000-0000-0000-000000000002', 'elena.advisor@apexautoworks.co.za', 'Elena Rostova', '+27821110002'),
('00000000-0000-0000-0000-000000000003', 'johan.owner@rivoniafleet.co.za', 'Johan Steyn', '+27822220001');

INSERT INTO public.business_members (id, business_id, user_id, role, is_active) VALUES
('aa111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'OWNER', true),
('aa222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000002', 'MANAGER', true),
('bb333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000003', 'OWNER', true);

-- 3. SEED WORKSHOP PROFILES
INSERT INTO public.workshops (business_id, hourly_labor_rate, default_parts_markup_pct, bay_count) VALUES
('11111111-1111-1111-1111-111111111111', 650.00, 25.00, 6),
('22222222-2222-2222-2222-222222222222', 750.00, 20.00, 10);

-- 4. SEED CUSTOMERS (Tenant-owned)
-- Tenant A Customers (Apex)
INSERT INTO public.customers (id, business_id, first_name, last_name, email, phone, address) VALUES
('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Sarah', 'Jenkins', 'sarah.j@techmail.co.za', '+27825550192', '42 High Street, Rondebosch, Cape Town'),
('c1111111-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'David', 'Khumalo', 'david.k@logistic.co.za', '+27834440188', '19 Waterfront Road, Cape Town');

-- Tenant B Customers (Rivonia)
INSERT INTO public.customers (id, business_id, first_name, last_name, email, phone, address) VALUES
('c2222222-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Michael', 'Van Der Merwe', 'michael.vdm@miningholdings.co.za', '+27845550211', '10 Sandton Drive, Johannesburg');

-- 5. SEED VEHICLES (Tenant-owned)
-- Tenant A Vehicles
INSERT INTO public.vehicles (id, business_id, customer_id, vin, license_plate, make, model, year, mileage, engine_code, transmission) VALUES
('v1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'WBA3A5C50DF289110', 'CA 892-104', 'BMW', '320i Sedan (F30)', 2018, 89400, 'B48B20', 'AUTOMATIC'),
('v1111111-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'c1111111-2222-2222-2222-222222222222', 'AHTBA3CD201928374', 'CA 551-309', 'Toyota', 'Hilux 2.8 GD-6 4x4', 2021, 54200, '1GD-FTV', 'MANUAL');

-- Tenant B Vehicles
INSERT INTO public.vehicles (id, business_id, customer_id, vin, license_plate, make, model, year, mileage, engine_code, transmission) VALUES
('v2222222-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'c2222222-1111-1111-1111-111111111111', 'WVWZZZAUZEW192837', 'JH 44 LK GP', 'Volkswagen', 'Golf 7 GTI 2.0 TSI', 2019, 76000, 'EA888 Gen 3', 'DSG');

-- 6. SEED GLOBAL SUPPLIERS
INSERT INTO public.suppliers (id, name, code, contact_email, phone, lead_time_rating, api_adapter) VALUES
('s0000000-0000-0000-0000-000000000001', 'Bosch Auto Distribution', 'BOSCH-SA', 'orders@bosch-auto.co.za', '+27116550100', 4.8, 'BOSCH_REST_V2'),
('s0000000-0000-0000-0000-000000000002', 'EuroCar Wholesalers', 'EUROCAR-JHB', 'trade@eurocar.co.za', '+27118880200', 4.4, 'EUROCAR_XML_FEED'),
('s0000000-0000-0000-0000-000000000003', 'OEM Direct Logistics', 'OEM-DIRECT', 'b2b@oemdirect.co.za', '+27219990300', 4.9, 'OEM_EDI_CONNECTOR');

-- 7. SEED MASTER PARTS
INSERT INTO public.parts (id, part_number, name, category, description, oem_reference, is_oem) VALUES
('p0000000-0000-0000-0000-000000000001', 'BOS-0986494', 'Ceramic Front Brake Pad Set', 'Braking System', 'Low-dust premium ceramic front brake pads with wear sensors', '34116850885', false),
('p0000000-0000-0000-0000-000000000002', 'BRM-0997721', 'Brembo Vented Front Brake Disc Pair', 'Braking System', 'High carbon corrosion-resistant front brake rotors 312mm', '34116854999', false),
('p0000000-0000-0000-0000-000000000003', 'MAN-HU711/51', 'Mann-Filter High Efficiency Oil Filter', 'Service & Engine', 'Extended life synthetic fleece oil filter cartridge', '11427618461', true),
('p0000000-0000-0000-0000-000000000004', 'NGK-SILZKBR8', 'NGK Laser Iridium Spark Plug (Pack of 4)', 'Ignition & Electrical', 'Pre-gapped high-performance laser welded iridium spark plugs', '12120039664', false),
('p0000000-0000-0000-0000-000000000005', 'GAT-K060720', 'Gates Micro-V Serpentine Belt', 'Belts & Cooling', 'EPDM rubber auxiliary drive belt for alternator and AC', '11287618848', false);

-- 8. SEED SUPPLIER PRICING MATRIX (Enables Cross-Supplier Offer Comparison)
INSERT INTO public.supplier_parts (id, supplier_id, part_id, supplier_sku, cost_price, currency, stock_quantity, availability, lead_time_days) VALUES
-- Brake Pads across 3 suppliers
('sp000000-0000-0000-0000-000000000001', 's0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', 'BOS-SA-BP01', 620.00, 'ZAR', 18, 'IN_STOCK', 1),
('sp000000-0000-0000-0000-000000000002', 's0000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000001', 'EUR-BP-881', 585.00, 'ZAR', 4, 'LOW_STOCK', 2),
('sp000000-0000-0000-0000-000000000003', 's0000000-0000-0000-0000-000000000003', 'p0000000-0000-0000-0000-000000000001', 'OEM-DIR-3411', 780.00, 'ZAR', 25, 'IN_STOCK', 1),

-- Brake Discs across 2 suppliers
('sp000000-0000-0000-0000-000000000004', 's0000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000002', 'EUR-BD-997', 1450.00, 'ZAR', 8, 'IN_STOCK', 1),
('sp000000-0000-0000-0000-000000000005', 's0000000-0000-0000-0000-000000000003', 'p0000000-0000-0000-0000-000000000002', 'OEM-DIR-3412', 1720.00, 'ZAR', 12, 'IN_STOCK', 1),

-- Oil Filter across 2 suppliers
('sp000000-0000-0000-0000-000000000006', 's0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000003', 'BOS-SA-OF51', 145.00, 'ZAR', 40, 'IN_STOCK', 1),
('sp000000-0000-0000-0000-000000000007', 's0000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000003', 'EUR-OF-711', 130.00, 'ZAR', 15, 'IN_STOCK', 2);

-- 9. SEED SAMPLE QUOTATIONS
-- Apex Quote 1: APPROVED (With Order)
INSERT INTO public.quotations (
    id, business_id, quotation_number, customer_id, vehicle_id, status, 
    parts_subtotal, labor_subtotal, tax_rate, tax_amount, discount_amount, grand_total, 
    notes, valid_until, sent_at, approved_at, created_by
) VALUES (
    'q1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 
    'QT-2026-0001', 'c1111111-1111-1111-1111-111111111111', 'v1111111-1111-1111-1111-111111111111', 
    'APPROVED', 775.00, 975.00, 15.00, 262.50, 0.00, 2012.50, 
    'Customer approved front ceramic brake pad replacement.', 
    now() + interval '14 days', now() - interval '2 days', now() - interval '1 day',
    '00000000-0000-0000-0000-000000000002'
);

INSERT INTO public.quotation_items (id, quotation_id, part_id, supplier_part_id, item_type, description, quantity, unit_cost, markup_pct, unit_price, labor_hours, labor_rate, line_total) VALUES
('qi111111-1111-1111-1111-111111111111', 'q1111111-1111-1111-1111-111111111111', 'p0000000-0000-0000-0000-000000000001', 'sp000000-0000-0000-0000-000000000001', 'PART', 'BOS-0986494 Ceramic Front Brake Pad Set', 1, 620.00, 25.00, 775.00, 0.00, 0.00, 775.00),
('qi111111-2222-2222-2222-222222222222', 'q1111111-1111-1111-1111-111111111111', NULL, NULL, 'LABOR', 'Front Brake Inspection, Fitment & Sensor Calibrate', 1, 0.00, 0.00, 975.00, 1.50, 650.00, 975.00);

-- Apex Order 1 (Derived from Approved Quote)
INSERT INTO public.orders (id, business_id, quotation_id, order_number, status, total_amount, placed_at) VALUES
('ord11111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'q1111111-1111-1111-1111-111111111111', 'ORD-2026-0001', 'CONFIRMED', 2012.50, now() - interval '1 day');

-- Apex Quote 2: DRAFT
INSERT INTO public.quotations (
    id, business_id, quotation_number, customer_id, vehicle_id, status, 
    parts_subtotal, labor_subtotal, tax_rate, tax_amount, discount_amount, grand_total, 
    notes, valid_until, created_by
) VALUES (
    'q1111111-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 
    'QT-2026-0002', 'c1111111-2222-2222-2222-222222222222', 'v1111111-2222-2222-2222-222222222222', 
    'DRAFT', 181.25, 650.00, 15.00, 124.69, 0.00, 955.94, 
    'Major service 60,000km oil & filter change draft', 
    now() + interval '14 days',
    '00000000-0000-0000-0000-000000000002'
);

INSERT INTO public.quotation_items (id, quotation_id, part_id, supplier_part_id, item_type, description, quantity, unit_cost, markup_pct, unit_price, labor_hours, labor_rate, line_total) VALUES
('qi111111-3333-3333-3333-333333333333', 'q1111111-2222-2222-2222-222222222222', 'p0000000-0000-0000-0000-000000000003', 'sp000000-0000-0000-0000-000000000006', 'PART', 'MAN-HU711/51 Mann Oil Filter Cartridge', 1, 145.00, 25.00, 181.25, 0.00, 0.00, 181.25),
('qi111111-4444-4444-4444-444444444444', 'q1111111-2222-2222-2222-222222222222', NULL, NULL, 'LABOR', 'Engine Oil Flush, Drain & Filter Replacement', 1, 0.00, 0.00, 650.00, 1.00, 650.00, 650.00);

-- Rivonia Quote (Tenant B): SENT
INSERT INTO public.quotations (
    id, business_id, quotation_number, customer_id, vehicle_id, status, 
    parts_subtotal, labor_subtotal, tax_rate, tax_amount, discount_amount, grand_total, 
    notes, valid_until, sent_at, created_by
) VALUES (
    'q2222222-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 
    'QT-2026-0099', 'c2222222-1111-1111-1111-111111111111', 'v2222222-1111-1111-1111-111111111111', 
    'SENT', 1740.00, 1125.00, 15.00, 429.75, 0.00, 3294.75, 
    'GTI Front Brembo Disc upgrade quotation sent to Michael', 
    now() + interval '7 days', now() - interval '6 hours',
    '00000000-0000-0000-0000-000000000003'
);
