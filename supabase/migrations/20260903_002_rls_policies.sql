-- ============================================================================
-- DrivePlugAutoSA - PostgreSQL Row Level Security (RLS) Policies
-- Version: 20260903_002
-- Engine: PostgreSQL 15+ (Supabase)
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTIONS FOR AIRTIGHT RLS PERFORMANCE & ENFORCEMENT
-- ============================================================================

-- Returns set of active business IDs for the currently authenticated user
CREATE OR REPLACE FUNCTION public.get_auth_business_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT business_id 
  FROM business_members 
  WHERE user_id = auth.uid() 
    AND is_active = true;
$$;

-- Checks if the authenticated user has any of the specified roles in a business
CREATE OR REPLACE FUNCTION public.has_business_role(target_business_id UUID, required_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM business_members 
    WHERE business_id = target_business_id 
      AND user_id = auth.uid() 
      AND role = ANY(required_roles) 
      AND is_active = true
  );
$$;

-- ============================================================================
-- 1. BUSINESSES POLICIES
-- ============================================================================
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "businesses_select_member"
    ON public.businesses FOR SELECT
    USING (id IN (SELECT get_auth_business_ids()));

CREATE POLICY "businesses_update_owner_admin"
    ON public.businesses FOR UPDATE
    USING (has_business_role(id, ARRAY['OWNER', 'ADMIN']))
    WITH CHECK (has_business_role(id, ARRAY['OWNER', 'ADMIN']));

-- ============================================================================
-- 2. BUSINESS_MEMBERS POLICIES
-- ============================================================================
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business_members_select_peer"
    ON public.business_members FOR SELECT
    USING (business_id IN (SELECT get_auth_business_ids()));

CREATE POLICY "business_members_manage_admin"
    ON public.business_members FOR ALL
    USING (has_business_role(business_id, ARRAY['OWNER', 'ADMIN']))
    WITH CHECK (has_business_role(business_id, ARRAY['OWNER', 'ADMIN']));

-- ============================================================================
-- 3. WORKSHOPS & DEALERSHIPS POLICIES
-- ============================================================================
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealerships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workshops_select_member"
    ON public.workshops FOR SELECT
    USING (business_id IN (SELECT get_auth_business_ids()));

CREATE POLICY "workshops_update_admin"
    ON public.workshops FOR UPDATE
    USING (has_business_role(business_id, ARRAY['OWNER', 'ADMIN', 'MANAGER']))
    WITH CHECK (has_business_role(business_id, ARRAY['OWNER', 'ADMIN', 'MANAGER']));

CREATE POLICY "dealerships_select_member"
    ON public.dealerships FOR SELECT
    USING (business_id IN (SELECT get_auth_business_ids()));

CREATE POLICY "dealerships_update_admin"
    ON public.dealerships FOR UPDATE
    USING (has_business_role(business_id, ARRAY['OWNER', 'ADMIN']))
    WITH CHECK (has_business_role(business_id, ARRAY['OWNER', 'ADMIN']));

-- ============================================================================
-- 4. CUSTOMERS POLICIES (Strict Tenant Isolation)
-- ============================================================================
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_select_tenant"
    ON public.customers FOR SELECT
    USING (business_id IN (SELECT get_auth_business_ids()));

CREATE POLICY "customers_insert_tenant"
    ON public.customers FOR INSERT
    WITH CHECK (has_business_role(business_id, ARRAY['OWNER', 'ADMIN', 'MANAGER', 'STAFF']));

CREATE POLICY "customers_update_tenant"
    ON public.customers FOR UPDATE
    USING (has_business_role(business_id, ARRAY['OWNER', 'ADMIN', 'MANAGER', 'STAFF']))
    WITH CHECK (has_business_role(business_id, ARRAY['OWNER', 'ADMIN', 'MANAGER', 'STAFF']));

CREATE POLICY "customers_delete_tenant"
    ON public.customers FOR DELETE
    USING (has_business_role(business_id, ARRAY['OWNER', 'ADMIN']));

-- ============================================================================
-- 5. VEHICLES POLICIES (Strict Tenant Isolation)
-- ============================================================================
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vehicles_select_tenant"
    ON public.vehicles FOR SELECT
    USING (business_id IN (SELECT get_auth_business_ids()));

CREATE POLICY "vehicles_insert_tenant"
    ON public.vehicles FOR INSERT
    WITH CHECK (has_business_role(business_id, ARRAY['OWNER', 'ADMIN', 'MANAGER', 'STAFF']));

CREATE POLICY "vehicles_update_tenant"
    ON public.vehicles FOR UPDATE
    USING (has_business_role(business_id, ARRAY['OWNER', 'ADMIN', 'MANAGER', 'STAFF']))
    WITH CHECK (has_business_role(business_id, ARRAY['OWNER', 'ADMIN', 'MANAGER', 'STAFF']));

CREATE POLICY "vehicles_delete_tenant"
    ON public.vehicles FOR DELETE
    USING (has_business_role(business_id, ARRAY['OWNER', 'ADMIN']));

-- ============================================================================
-- 6. GLOBAL CATALOGUES (Suppliers, Parts, Supplier Parts)
-- ============================================================================
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_parts ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read parts & supplier offers
CREATE POLICY "suppliers_read_authenticated"
    ON public.suppliers FOR SELECT
    TO authenticated
    USING (is_active = true);

CREATE POLICY "parts_read_authenticated"
    ON public.parts FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "supplier_parts_read_authenticated"
    ON public.supplier_parts FOR SELECT
    TO authenticated
    USING (true);

-- ============================================================================
-- 7. QUOTATIONS POLICIES (Strict Tenant Isolation & State Protection)
-- ============================================================================
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quotations_select_tenant"
    ON public.quotations FOR SELECT
    USING (business_id IN (SELECT get_auth_business_ids()));

CREATE POLICY "quotations_insert_tenant"
    ON public.quotations FOR INSERT
    WITH CHECK (has_business_role(business_id, ARRAY['OWNER', 'ADMIN', 'MANAGER', 'STAFF']));

CREATE POLICY "quotations_update_tenant"
    ON public.quotations FOR UPDATE
    USING (has_business_role(business_id, ARRAY['OWNER', 'ADMIN', 'MANAGER', 'STAFF']))
    WITH CHECK (has_business_role(business_id, ARRAY['OWNER', 'ADMIN', 'MANAGER', 'STAFF']));

-- Only allow deletion of DRAFT quotations by OWNER or ADMIN
CREATE POLICY "quotations_delete_draft_only"
    ON public.quotations FOR DELETE
    USING (has_business_role(business_id, ARRAY['OWNER', 'ADMIN']) AND status = 'DRAFT');

-- ============================================================================
-- 8. QUOTATION_ITEMS POLICIES (Inherits Tenant from Quotations)
-- ============================================================================
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quotation_items_select_tenant"
    ON public.quotation_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.quotations q
        WHERE q.id = quotation_items.quotation_id
          AND q.business_id IN (SELECT get_auth_business_ids())
    ));

CREATE POLICY "quotation_items_modify_tenant"
    ON public.quotation_items FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.quotations q
        WHERE q.id = quotation_items.quotation_id
          AND has_business_role(q.business_id, ARRAY['OWNER', 'ADMIN', 'MANAGER', 'STAFF'])
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.quotations q
        WHERE q.id = quotation_items.quotation_id
          AND has_business_role(q.business_id, ARRAY['OWNER', 'ADMIN', 'MANAGER', 'STAFF'])
    ));

-- ============================================================================
-- 9. ORDERS POLICIES (Strict Tenant Isolation)
-- ============================================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_select_tenant"
    ON public.orders FOR SELECT
    USING (business_id IN (SELECT get_auth_business_ids()));

CREATE POLICY "orders_modify_tenant"
    ON public.orders FOR ALL
    USING (has_business_role(business_id, ARRAY['OWNER', 'ADMIN', 'MANAGER']))
    WITH CHECK (has_business_role(business_id, ARRAY['OWNER', 'ADMIN', 'MANAGER']));

-- ============================================================================
-- 10. AUDIT_LOGS POLICIES
-- ============================================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_select_tenant"
    ON public.audit_logs FOR SELECT
    USING (has_business_role(business_id, ARRAY['OWNER', 'ADMIN']));

CREATE POLICY "audit_logs_insert_system"
    ON public.audit_logs FOR INSERT
    WITH CHECK (business_id IN (SELECT get_auth_business_ids()));
