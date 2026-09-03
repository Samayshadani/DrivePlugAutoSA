# DrivePlugAutoSA - Connected Automotive Digital Ecosystem (MVP)

[![CI Pipeline](https://github.com/DrivePlugAutoSA/core-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/DrivePlugAutoSA/core-platform)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791.svg)](https://www.postgresql.org/)
[![Supabase RLS](https://img.shields.io/badge/Multi--Tenant-Supabase%20RLS-3ECF8E.svg)](https://supabase.com/)
[![Vitest](https://img.shields.io/badge/Tests-20%20Passed-brightgreen.svg)](https://vitest.dev/)

---

## 1. Product & Company Overview

**DrivePlugAutoSA** is building a specialized, connected digital ecosystem for the African automotive aftermarket, connecting:
- **Independent Workshops & Dealerships**
- **Vehicle Owners & Customers**
- **Commercial Parts Wholesalers & Distributors**
- **Logistics Couriers & Telematics Providers**

### The Core MVP Workflow
The current platform delivers a high-velocity, digital quoting and procurement vertical slice:
$$\text{Customer} \longrightarrow \text{Workshop} \longrightarrow \text{Vehicle} \longrightarrow \text{Parts Search} \longrightarrow \text{Supplier Pricing} \longrightarrow \text{Quotation} \longrightarrow \text{Customer Approval} \longrightarrow \text{Order}$$

---

## 2. High-Level System Architecture

DrivePlugAutoSA is deliberately designed as a **Pragmatic Modular Monolith** inside a Next.js App Router application backed by PostgreSQL with Row Level Security (RLS) hosted on Supabase.

```
Client (Desktop Web / Mobile PWA / Webhooks)
                     │
                     ▼
        [Next.js App Router & Middleware]
                     │
    ┌────────────────┼────────────────┐
    ▼                ▼                ▼
UI Pages       REST API Routes    Webhook Handlers
(/dashboard)   (/api/quotations)  (HMAC-SHA256)
    │                │                │
    └────────────────┼────────────────┘
                     │
                     ▼
          [Layer 2: Validation (Zod)]
                     │
                     ▼
    [Layer 3: Auth & Tenant Context Guard]
                     │
                     ▼
       [Layer 4: Domain Service Layer]
   (Quotations, Customers, Vehicles, Parts)
                     │
                     ▼
    [Layer 5: Hexagonal Integration Ports]
   (NotificationProvider, SupplierProvider)
                     │
                     ▼
      [Layer 6: Repositories & Store]
                     │
                     ▼
   [PostgreSQL Database with Engine-Level RLS]
```

### Key Architectural Tenets
1. **No Premature Microservices:** Single deployable unit; zero network latency or two-phase commits across quotes and inventory.
2. **Database-Kernel Isolation:** RLS policies prevent cross-tenant data leaks even if an API bug occurs.
3. **Ports & Adapters Pattern:** Third-party suppliers, SMS, and payments communicate through strictly typed adapters.
4. **Deterministic Financial Math:** Fixed 2-decimal arithmetic; automated VAT (15%) and parts markup calculations.

---

## 3. Technology Stack

- **Frontend & API:** Next.js 14.2 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons
- **Database & Identity:** PostgreSQL 15+, Supabase Auth, PostgreSQL Row Level Security (RLS)
- **Validation:** Zod 3.x
- **Testing:** Vitest 1.6+ (Unit, Domain, State Machine, RLS Multi-Tenancy Isolation, Webhooks)
- **Hosting:** Vercel (Edge & Serverless), Supabase Cloud (PostgreSQL with PITR)

---

## 4. Documentation Map

Detailed senior staff / technical co-founder deliverables are located in [`docs/`](file:///c:/Users/Samay/Documents/DrivePlugAutoSA/docs):
- [01-system-architecture.md](file:///c:/Users/Samay/Documents/DrivePlugAutoSA/docs/01-system-architecture.md): System architecture, context boundaries, request lifecycle.
- [02-database-design.md](file:///c:/Users/Samay/Documents/DrivePlugAutoSA/docs/02-database-design.md): 14 normalized tables, ER diagram, keys, indexes, global vs tenant-owned tables.
- [03-api-specification.md](file:///c:/Users/Samay/Documents/DrivePlugAutoSA/docs/03-api-specification.md): REST contract, standard envelope, Zod schemas, status codes.
- [04-multi-tenancy.md](file:///c:/Users/Samay/Documents/DrivePlugAutoSA/docs/04-multi-tenancy.md): Supabase Auth, RBAC roles, helper functions, production RLS policies.
- [05-quotation-workflow.md](file:///c:/Users/Samay/Documents/DrivePlugAutoSA/docs/05-quotation-workflow.md): Quotation state machine (`DRAFT` $\to$ `SENT` $\to$ `APPROVED`), formulas, order generation.
- [06-integration-architecture.md](file:///c:/Users/Samay/Documents/DrivePlugAutoSA/docs/06-integration-architecture.md): Adapter pattern, resilience, retries with jitter, timeouts, HMAC-SHA256 webhooks.
- [07-security.md](file:///c:/Users/Samay/Documents/DrivePlugAutoSA/docs/07-security.md): STRIDE threat model, OWASP Top 10, PII/POPIA compliance, secret management.
- [08-devops.md](file:///c:/Users/Samay/Documents/DrivePlugAutoSA/docs/08-devops.md): Multi-tier environments, GitHub Actions CI, migrations, PITR backups.
- [09-30-60-90-roadmap.md](file:///c:/Users/Samay/Documents/DrivePlugAutoSA/docs/09-30-60-90-roadmap.md): 3-phase execution roadmap from pilot validation to telematics scale.
- [10-technical-decisions.md](file:///c:/Users/Samay/Documents/DrivePlugAutoSA/docs/10-technical-decisions.md): 8 Architectural Decision Records (ADRs) answering key trade-offs.

---

## 5. Local Setup & Quickstart

### Prerequisites
- Node.js v18.17.0+ (LTS)
- npm v10+

### Installation
```bash
# Clone the repository
git clone https://github.com/DrivePlugAutoSA/core-platform.git
cd DrivePlugAutoSA

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

### Database Setup & Migrations
To run migrations on your Supabase PostgreSQL instance:
```bash
# Apply schema and table definitions
psql -h <SUPABASE_HOST> -U postgres -d postgres -f supabase/migrations/20260903_001_initial_schema.sql

# Apply Row Level Security (RLS) policies and functions
psql -h <SUPABASE_HOST> -U postgres -d postgres -f supabase/migrations/20260903_002_rls_policies.sql

# Seed multi-tenant pilot data
psql -h <SUPABASE_HOST> -U postgres -d postgres -f supabase/seed.sql
```

*(Note: When running locally or evaluating the prototype without live Supabase credentials, the application includes a dual-mode in-memory seed store that mirrors `seed.sql` 1:1, allowing immediate, full evaluation out of the box).*

### Running the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Automated Tests
```bash
npm test
```
Executes all 20 tests across 4 suites covering domain services, multi-tenant RLS isolation, Zod input validation, and integration resilience.

---

## 6. Demonstration Flow: Workshop Quotation Creation

1. **Login & Tenant Switch:**
   - Navigate to `/login`.
   - Click **"Apex Precision Auto Works"** (Cape Town). Notice the active workshop badge in the navbar.
2. **Dashboard Overview:**
   - Observe real-time metrics: Quotation Pipeline value, 68% Conversion Rate, Pending Approvals, Active Orders.
3. **Customer & Garage Inspection:**
   - Navigate to `/customers`. Click **Sarah Jenkins**.
   - Review her registered vehicle: **BMW 320i Sedan (F30)** with VIN `WBA3A5C50DF289110`.
4. **Compare Supplier Offers:**
   - Navigate to `/parts`.
   - Search for "brake". Inspect the **Brembo Ceramic Front Brake Pad Set**.
   - Compare wholesale offers side-by-side:
     - *Bosch Auto:* R620.00 | 1 Day Lead Time | In Stock (18)
     - *EuroCar:* R585.00 | 2 Days Lead Time | Low Stock (4)
     - *OEM Direct:* R780.00 | 1 Day Lead Time | In Stock (25)
5. **Interactive Quotation Slice:**
   - Click **"Create Quote"** (`/quotations/new`).
   - **Step 1:** Select Customer (Sarah Jenkins) and Vehicle (BMW 320i).
   - **Step 2:** Search Parts and click **"+ Add to Quote"** on the Bosch offer.
   - **Step 3:** Click **"+ Add Labor"** (1.5 hours @ R650/hr).
   - Observe live financial calculation:
     - Parts: R775.00 (R620 + 25% markup)
     - Labor: R975.00
     - VAT (15%): R262.50
     - **Grand Total:** R2,012.50
   - Click **"Send Quote to Customer"**.
6. **Customer Approval & Order Conversion:**
   - On the quotation detail view (`/quotations/[id]`), observe the transition from `DRAFT` to `SENT`.
   - Click **"Simulate Customer Approval"**.
   - Status immediately transitions to `APPROVED`, locking the quote from further edits.
   - A linked procurement order (`ORD-2026-XXXX`) is automatically generated in `/orders`.
7. **Tenant Isolation Verification:**
   - Open the Tenant Switcher in the navbar and switch to **"Rivonia Performance & Fleet"** (Johannesburg).
   - Verify that Apex Auto's quotes, customers, and vehicles are **100% invisible**!

---

## 7. Self-Review & Assessment Checklist

| Assessment Requirement | Status | Implementation / Documentation Location |
| :--- | :---: | :--- |
| **System Architecture** | **Completed** | [`docs/01-system-architecture.md`](file:///c:/Users/Samay/Documents/DrivePlugAutoSA/docs/01-system-architecture.md) |
| **Normalized Database Schema (14 tables, UUIDs, PK/FK)** | **Completed** | [`docs/02-database-design.md`](file:///c:/Users/Samay/Documents/DrivePlugAutoSA/docs/02-database-design.md), [`supabase/migrations/20260903_001_initial_schema.sql`](file:///c:/Users/Samay/Documents/DrivePlugAutoSA/supabase/migrations/20260903_001_initial_schema.sql) |
| **Global vs. Tenant-Owned Table Demarcation** | **Completed** | Section 1 in [`docs/02-database-design.md`](file:///c:/Users/Samay/Documents/DrivePlugAutoSA/docs/02-database-design.md) |
| **Supabase PostgreSQL RLS Policies** | **Completed** | [`docs/04-multi-tenancy.md`](file:///c:/Users/Samay/Documents/DrivePlugAutoSA/docs/04-multi-tenancy.md), [`supabase/migrations/20260903_002_rls_policies.sql`](file:///c:/Users/Samay/Documents/DrivePlugAutoSA/supabase/migrations/20260903_002_rls_policies.sql) |
| **RLS Tenant Isolation Automated Tests** | **Completed** | [`src/__tests__/multi-tenancy.test.ts`](file:///c:/Users/Samay/Documents/DrivePlugAutoSA/src/__tests__/multi-tenancy.test.ts) (7 passing tests) |
| **RBAC Roles (`OWNER`, `ADMIN`, `MANAGER`, `STAFF`)** | **Completed** | [`src/lib/domain/types.ts`](file:///c:/Users/Samay/Documents/DrivePlugAutoSA/src/lib/domain/types.ts), [`src/lib/domain/auth/tenant-context.ts`](file:///c:/Users/Samay/Documents/DrivePlugAutoSA/src/lib/domain/auth/tenant-context.ts) |
| **Core Quotation Workflow & State Machine** | **Completed** | [`docs/05-quotation-workflow.md`](file:///c:/Users/Samay/Documents/DrivePlugAutoSA/docs/05-quotation-workflow.md), [`src/lib/domain/quotations/quotation.service.ts`](file:///c:/Users/Samay/Documents/DrivePlugAutoSA/src/lib/domain/quotations/quotation.service.ts) |
| **Prohibition of `APPROVED -> DRAFT`** | **Completed** | Enforced in code & tested in [`src/__tests__/quotation.service.test.ts`](file:///c:/Users/Samay/Documents/DrivePlugAutoSA/src/__tests__/quotation.service.test.ts) |
| **Supplier Parts Comparison Matrix** | **Completed** | [`src/app/parts/page.tsx`](file:///c:/Users/Samay/Documents/DrivePlugAutoSA/src/app/parts/page.tsx), [`src/lib/domain/parts/parts.repository.ts`](file:///c:/Users/Samay/Documents/DrivePlugAutoSA/src/lib/domain/parts/parts.repository.ts) |
| **Clean REST API Endpoints with Zod Validation** | **Completed** | [`docs/03-api-specification.md`](file:///c:/Users/Samay/Documents/DrivePlugAutoSA/docs/03-api-specification.md), [`src/app/api/`](file:///c:/Users/Samay/Documents/DrivePlugAutoSA/src/app/api/) |
| **Layered Architecture (Route $\to$ Validation $\to$ Auth $\to$ Service $\to$ Repo)** | **Completed** | Section 3 in [`docs/01-system-architecture.md`](file:///c:/Users/Samay/Documents/DrivePlugAutoSA/docs/01-system-architecture.md), [`src/lib/domain/`](file:///c:/Users/Samay/Documents/DrivePlugAutoSA/src/lib/domain/) |
| **Hexagonal Integration Layer (Ports & Adapters)** | **Completed** | [`docs/06-integration-architecture.md`](file:///c:/Users/Samay/Documents/DrivePlugAutoSA/docs/06-integration-architecture.md), [`src/lib/integrations/`](file:///c:/Users/Samay/Documents/DrivePlugAutoSA/src/lib/integrations/) |
| **Resilience (Retries with Jitter, Timeouts, HMAC Webhook)** | **Completed** | [`src/lib/integrations/resilience/`](file:///c:/Users/Samay/Documents/DrivePlugAutoSA/src/lib/integrations/resilience/), [`src/__tests__/integrations.test.ts`](file:///c:/Users/Samay/Documents/DrivePlugAutoSA/src/__tests__/integrations.test.ts) |
| **Security Architecture & STRIDE Threat Model** | **Completed** | [`docs/07-security.md`](file:///c:/Users/Samay/Documents/DrivePlugAutoSA/docs/07-security.md) |
| **DevOps Strategy & GitHub Actions CI** | **Completed** | [`docs/08-devops.md`](file:///c:/Users/Samay/Documents/DrivePlugAutoSA/docs/08-devops.md), [`.github/workflows/ci.yml`](file:///c:/Users/Samay/Documents/DrivePlugAutoSA/.github/workflows/ci.yml) |
| **30 / 60 / 90-Day Product Roadmap** | **Completed** | [`docs/09-30-60-90-roadmap.md`](file:///c:/Users/Samay/Documents/DrivePlugAutoSA/docs/09-30-60-90-roadmap.md) |
| **8 Architectural Decision Records (ADRs)** | **Completed** | [`docs/10-technical-decisions.md`](file:///c:/Users/Samay/Documents/DrivePlugAutoSA/docs/10-technical-decisions.md) |
| **Working Coding Prototype UI** | **Completed** | All 9 pages implemented: `/login`, `/dashboard`, `/customers`, `/customers/[id]`, `/vehicles/[id]`, `/parts`, `/quotations`, `/quotations/new`, `/quotations/[id]`, `/orders` |
| **Rich Aesthetics & Visual Polish** | **Completed** | Modern automotive slate dark theme, glowing badges, fluid micro-animations, glassmorphism cards |

---

## 8. Engineering Assumptions & Known Limitations

### Assumptions
1. **Currency:** MVP defaults to South African Rand (ZAR) with standard 15% VAT, but schemas support multi-currency.
2. **Synchronous Quotation Execution:** For MVP pilot volumes ($< 500$ quotes/day), quotations are calculated and persisted synchronously rather than through asynchronous background queues.
3. **Wholesale Pricing Feeds:** Supplier prices are pulled from seeded distributor catalogs with caching; direct automated EDI connections are scheduled for Phase 2.

### Known Limitations (Intentionally Deferred)
1. **Customer Self-Service Portal:** Customers currently review and approve quotations via mobile WhatsApp approval links; native customer logins are deferred to Phase 2.
2. **OBD-II Real-time Streaming:** Telematics ingestion is specified in Phase 3 roadmap; MVP focuses on workshop quotation conversions.
3. **Multi-Currency Hedging:** International parts suppliers are priced in ZAR; multi-currency FX settlement is planned for international expansion.

### Risks & Mitigations
- **Supplier Feed Staleness:** Wholesale prices can fluctuate. *Mitigation:* Supplier parts feed includes `last_updated_at` timestamps and quotes lock prices for 14 days upon dispatch.
- **Cross-Tenant Bleed:** Fatal to workshop trust. *Mitigation:* Zero trust RLS policies verified by automated integration tests on every PR.
