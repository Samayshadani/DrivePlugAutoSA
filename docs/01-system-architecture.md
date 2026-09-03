# DrivePlugAutoSA - System Architecture

**Document Version:** 1.0.0  
**Author:** Principal Software Engineer & Technical Co-Founder  
**Status:** Approved for MVP Execution  
**Target Environment:** Vercel (Frontend & Edge/Node Serverless), Supabase (Managed PostgreSQL, Auth, Realtime, Storage)

---

## 1. Executive Summary & Domain Context

DrivePlugAutoSA is a specialized automotive operating network engineered to bridge fragmented industry actors:
- **Workshops (Independent & Chains):** Diagnostics, quoting, service management, parts procurement.
- **Dealerships:** Franchise service departments, certified vehicle maintenance, warranty handling.
- **End Customers & Vehicle Owners:** Live quotation approvals, transparent job tracking, service histories.
- **Parts Suppliers & Wholesalers:** Dynamic catalogue syndication, wholesale price feeds, live stock availability, delivery SLAs.
- **Logistics & Telematics Providers:** Dispatch tracking, parts courier integration, OBD-II vehicle telemetry.

The initial commercial wedge is the **Critical Quotation & Parts Procurement Workflow**:
$$\text{Customer} \longrightarrow \text{Workshop} \longrightarrow \text{Vehicle} \longrightarrow \text{Parts Search} \longrightarrow \text{Supplier Pricing} \longrightarrow \text{Quotation} \longrightarrow \text{Customer Approval} \longrightarrow \text{Order}$$

---

## 2. Architectural Paradigm: Pragmatic Modular Monolith

### Why Not Microservices?
At the pilot/MVP stage, introducing distributed microservices (e.g., separate services for `quote-service`, `parts-service`, `customer-service`, `notification-service`) introduces catastrophic operational friction without benefits:
- Distributed transactions & two-phase commits across quotes and inventory.
- Network latency overhead and serialization costs.
- Eventual consistency bugs during customer checkout.
- Multi-repository overhead and excessive DevOps toil for a team of 2–5 engineers.

Instead, DrivePlugAutoSA is structured as a **strictly encapsulated Modular Monolith** within a single Next.js / TypeScript codebase backed by PostgreSQL with Supabase Row Level Security (RLS).

### Module Boundaries & Directory Topology
```
DrivePlugAutoSA/
├── docs/                        # Architecture, DB, Security, DevOps, ADRs
├── supabase/
│   ├── migrations/              # DDL, Foreign Keys, Indexes, RLS Policies
│   └── seed.sql                 # Multi-tenant demo dataset
├── src/
│   ├── app/                     # Next.js App Router (UI Pages & REST Route Handlers)
│   │   ├── api/                 # Thin HTTP controllers (REST API)
│   │   ├── (dashboard)/         # Protected Workshop/Dealership Views
│   │   └── login/               # Authentication & Tenant Switcher
│   ├── components/              # Design System, Layout, Reactive Widgets
│   ├── lib/
│   │   ├── domain/              # Core Business Logic & Domain Models
│   │   │   ├── auth/            # Tenant Context & RBAC Guards
│   │   │   ├── businesses/      # Multi-tenant Business Management
│   │   │   ├── customers/       # Customer Entities & Operations
│   │   │   ├── vehicles/        # Automotive Registry (VIN, Engine, Mileage)
│   │   │   ├── parts/           # Master Catalogue & Aggregated Supplier Pricing
│   │   │   ├── quotations/      # Quotation State Machine, Pricing Calculations
│   │   │   ├── orders/          # Procurement Order Lifecycle
│   │   │   └── validation/      # Zod Schemas (Runtime Contracts)
│   │   ├── integrations/        # Hexagonal Ports & Adapters
│   │   │   ├── notifications/   # WhatsApp, SMS, Email Adapters
│   │   │   ├── suppliers/       # Parts Catalogue & Live Pricing Adapters
│   │   │   ├── payments/        # Payment Gateway Adapters
│   │   │   └── resilience/      # Retry, Timeout, Circuit Breaker, HMAC
│   │   └── db/                  # Data Access & Supabase Client Factory
│   └── __tests__/               # Vitest Suite (RLS, State Machine, Integrations)
```

---

## 3. Layered Request Lifecycle

Every client interaction flows strictly downward through six deterministic layers. Business logic is strictly barred from living inside Route Handlers or UI components.

```
Client (Web / Mobile PWA / Webhook)
                │
                ▼
   [Layer 1: Route Handler]
   • URL routing, HTTP method matching (GET/POST/PATCH/DELETE)
   • Extracts headers, cookies, query parameters, JSON body
                │
                ▼
   [Layer 2: Schema Validation (Zod)]
   • Rejects malformed types, invalid formats, missing fields
   • Sanitizes strings, parses UUIDs, enforces numeric constraints
                │
                ▼
   [Layer 3: Authentication & Tenant Guard]
   • Validates Supabase JWT session (auth.uid())
   • Resolves tenant context (business_id) via business_members
   • Asserts RBAC permissions (OWNER, ADMIN, MANAGER, STAFF)
                │
                ▼
   [Layer 4: Domain Service Layer]
   • Pure business logic, state machines, financial calculations
   • Invariant enforcement (e.g. APPROVED quotes cannot revert to DRAFT)
   • Domain events dispatch (e.g. OnQuoteApproved -> CreateOrder)
                │
                ▼
   [Layer 5: Repository / Data Access Layer]
   • Encapsulates Supabase queries, relational joins, transactions
   • Passes tenant context to enforce RLS boundaries
                │
                ▼
   [Layer 6: PostgreSQL Database (Supabase)]
   • Row Level Security (RLS) enforcement at the database kernel
   • Foreign key integrity, unique constraints, trigger timestamps
```

---

## 4. Cross-Cutting Concerns

1. **Unified Error Envelope:**
   All API endpoints serialize failures through a standard response format:
   ```json
   {
     "success": false,
     "error": {
       "code": "INVALID_STATE_TRANSITION",
       "message": "Quotation in status 'APPROVED' cannot transition back to 'DRAFT'.",
       "details": { "currentStatus": "APPROVED", "targetStatus": "DRAFT" }
     }
   }
   ```

2. **Tenant Context Propagation:**
   Requests carry an active tenant header (`x-business-id`) or session cookie. The backend verifies whether the authenticated user has an active membership in that `business_id` before querying data.

3. **Audit Logging:**
   High-value mutations (e.g. quote status changes, discounts > 20%, order fulfillment) write an immutable record to `audit_logs` capturing `user_id`, `business_id`, `entity_type`, `entity_id`, and diff payloads (`old_values`, `new_values`).

4. **Telemetry & Structured Logging:**
   Log events are serialized as structured JSON with correlation IDs (`trace_id`), enabling seamless ingestion into Datadog, Axiom, or Supabase Logflare.
