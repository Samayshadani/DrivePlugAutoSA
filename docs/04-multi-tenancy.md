# DrivePlugAutoSA - Multi-Tenant Architecture & RLS Security Model

**Document Version:** 1.0.0  
**Isolation Paradigm:** Logical Separation via PostgreSQL Row Level Security (RLS)  
**Security Baseline:** Zero Trust, Defense-in-Depth  

---

## 1. Multi-Tenant Philosophy

Automotive workshops operate in high-friction, competitive local markets. A breach where Workshop A can view Workshop B's customer names, vehicle VINs, quote pricing margins, or supplier discounts would be fatal to company reputation and violate GDPR / POPIA data privacy laws.

DrivePlugAutoSA enforces **Multi-Tenant Isolation at the Database Engine level** using PostgreSQL Row Level Security (RLS) linked to Supabase Auth.

```
       Supabase Auth JWT (auth.uid())
                     │
                     ▼
          [business_members table]
   (user_id, business_id, role, is_active)
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
   Workshop A                Workshop B
 (business_id = 'A')       (business_id = 'B')
        │                         │
 ┌──────┴──────┐           ┌──────┴──────┐
 ▼             ▼           ▼             ▼
Customers   Quotes      Customers     Quotes
 (Tenant A) (Tenant A)   (Tenant B)  (Tenant B)
```

Frontend filters and application-level `WHERE business_id = ?` clauses are **never** treated as security boundaries. If an attacker bypasses the API layer or injects an invalid ID, PostgreSQL RLS unconditionally filters or rejects the query.

---

## 2. Role-Based Access Control (RBAC) Hierarchy

Roles are defined per business membership in `business_members.role`:

| Role | Scope & Permissions | Extensibility Path |
| :--- | :--- | :--- |
| **`OWNER`** | Full root access to business settings, financial margins, tax IDs, member invites, billing, and all operational records. | Future: Transfer business ownership, legal entity re-assignment. |
| **`ADMIN`** | Management of staff, customer accounts, master price markups, labor rates, and approval overrides. | Future: Branch-specific admin constraints. |
| **`MANAGER`** | Can create/edit/send/approve quotes, place supplier orders, manage vehicle and customer records. Cannot modify business legal or bank settings. | Future: Approval thresholds (e.g. quotes > $5,000 require Admin). |
| **`STAFF`** (Technician / Service Advisor) | Can view customer and vehicle details, create draft quotes, inspect parts catalog. Cannot view backend wholesale supplier margins or delete records. | Future: Apprentice mode, read-only technician checklist. |

---

## 3. Database Helper Functions for RLS

To maintain low latency and eliminate duplicate subqueries in RLS policies, PostgreSQL helper functions are marked `SECURITY DEFINER` and `STABLE`:

```sql
-- Returns all active business IDs the authenticated user belongs to
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

-- Checks if the authenticated user has a specific minimum role in a business
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
```

---

## 4. Production Row Level Security Policies

### 4.1. `customers` Table
```sql
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- SELECT: Only members of the owning business
CREATE POLICY "customers_select_tenant_isolation"
  ON customers FOR SELECT
  USING (business_id IN (SELECT get_auth_business_ids()));

-- INSERT: Members of the business with role OWNER, ADMIN, MANAGER, or STAFF
CREATE POLICY "customers_insert_tenant_isolation"
  ON customers FOR INSERT
  WITH CHECK (has_business_role(business_id, ARRAY['OWNER', 'ADMIN', 'MANAGER', 'STAFF']));

-- UPDATE: Members of the business
CREATE POLICY "customers_update_tenant_isolation"
  ON customers FOR UPDATE
  USING (has_business_role(business_id, ARRAY['OWNER', 'ADMIN', 'MANAGER', 'STAFF']))
  WITH CHECK (has_business_role(business_id, ARRAY['OWNER', 'ADMIN', 'MANAGER', 'STAFF']));

-- DELETE: Strictly restricted to OWNER and ADMIN
CREATE POLICY "customers_delete_tenant_isolation"
  ON customers FOR DELETE
  USING (has_business_role(business_id, ARRAY['OWNER', 'ADMIN']));
```

### 4.2. `vehicles` Table
```sql
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vehicles_select_tenant_isolation"
  ON vehicles FOR SELECT
  USING (business_id IN (SELECT get_auth_business_ids()));

CREATE POLICY "vehicles_insert_tenant_isolation"
  ON vehicles FOR INSERT
  WITH CHECK (has_business_role(business_id, ARRAY['OWNER', 'ADMIN', 'MANAGER', 'STAFF']));

CREATE POLICY "vehicles_update_tenant_isolation"
  ON vehicles FOR UPDATE
  USING (has_business_role(business_id, ARRAY['OWNER', 'ADMIN', 'MANAGER', 'STAFF']))
  WITH CHECK (has_business_role(business_id, ARRAY['OWNER', 'ADMIN', 'MANAGER', 'STAFF']));

CREATE POLICY "vehicles_delete_tenant_isolation"
  ON vehicles FOR DELETE
  USING (has_business_role(business_id, ARRAY['OWNER', 'ADMIN']));
```

### 4.3. `quotations` & `quotation_items` Tables
```sql
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quotations_select_tenant_isolation"
  ON quotations FOR SELECT
  USING (business_id IN (SELECT get_auth_business_ids()));

CREATE POLICY "quotations_insert_tenant_isolation"
  ON quotations FOR INSERT
  WITH CHECK (has_business_role(business_id, ARRAY['OWNER', 'ADMIN', 'MANAGER', 'STAFF']));

CREATE POLICY "quotations_update_tenant_isolation"
  ON quotations FOR UPDATE
  USING (has_business_role(business_id, ARRAY['OWNER', 'ADMIN', 'MANAGER', 'STAFF']))
  WITH CHECK (has_business_role(business_id, ARRAY['OWNER', 'ADMIN', 'MANAGER', 'STAFF']));

CREATE POLICY "quotations_delete_tenant_isolation"
  ON quotations FOR DELETE
  USING (has_business_role(business_id, ARRAY['OWNER', 'ADMIN']) AND status = 'DRAFT');

-- Quotation Items: inherit tenant boundary through parent quotation
CREATE POLICY "quotation_items_select_tenant_isolation"
  ON quotation_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM quotations q 
    WHERE q.id = quotation_items.quotation_id 
      AND q.business_id IN (SELECT get_auth_business_ids())
  ));

CREATE POLICY "quotation_items_write_tenant_isolation"
  ON quotation_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM quotations q 
    WHERE q.id = quotation_items.quotation_id 
      AND has_business_role(q.business_id, ARRAY['OWNER', 'ADMIN', 'MANAGER', 'STAFF'])
  ));
```

### 4.4. `orders` Table
```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_select_tenant_isolation"
  ON orders FOR SELECT
  USING (business_id IN (SELECT get_auth_business_ids()));

CREATE POLICY "orders_write_tenant_isolation"
  ON orders FOR ALL
  USING (has_business_role(business_id, ARRAY['OWNER', 'ADMIN', 'MANAGER']));
```

---

## 5. Verification & Test Guarantees

Our automated test suite explicitly demonstrates:
1. **Read Isolation:** Workshop A querying `/api/customers` receives only Workshop A records; Workshop B's customers are filtered at the database level.
2. **Write Isolation:** Attempting to update `quotations.id = 'B-123'` with Workshop A's credentials yields 0 modified rows or 404/403.
3. **Delete Isolation:** Workshop A cannot delete Workshop B's vehicles.
4. **Unauthenticated / Non-Member Rejection:** Requests with expired JWTs or users not present in `business_members` are rejected with HTTP 401 / 403.
