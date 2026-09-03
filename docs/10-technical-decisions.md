# DrivePlugAutoSA - Architectural Decision Records (ADRs)

**Document Version:** 1.0.0  
**Context:** Technical Co-Founder & Senior Staff Engineering Strategy  
**Repository:** DrivePlugAutoSA  

---

## ADR 01: Modular Monolith Architecture over Microservices

### Context
At early-stage / seed pilot phase, speed of iteration, relational data integrity, and operational simplicity are paramount. We must avoid premature microservice distribution.

### Decision
We adopt a **strictly encapsulated Modular Monolith** inside a single Next.js TypeScript application. Domain modules (`quotations`, `customers`, `vehicles`, `parts`, `suppliers`, `orders`) communicate through clean in-memory TypeScript service interfaces rather than network RPCs or HTTP microservices.

### Consequences
- **Positive:** Instant ACID transactions across quotes and orders; single deployment pipeline to Vercel; zero Kubernetes cluster management; trivial refactoring and type safety across frontend and backend.
- **Negative:** Independent scaling of single domain components is not possible yet (mitigated by serverless auto-scaling on Vercel).

---

## ADR 02: Selection of PostgreSQL with Supabase

### Context
The automotive ecosystem requires strict relational schema guarantees (VIN uniqueness, quotation line items, foreign key integrity to parts and suppliers), paired with rapid time-to-market for authentication and file storage.

### Decision
We choose **PostgreSQL 15+ hosted on Supabase Cloud**. We utilize Supabase Auth for identity management, PostgreSQL for relational storage, and Supabase Storage for vehicle inspection images and quotation PDF archives.

### Consequences
- **Positive:** Battle-tested SQL engine; native support for JSONB, UUIDs, full-text search; built-in Row Level Security (RLS); open-source standard with zero vendor lock-in (can migrate to vanilla RDS/Cloud SQL at any time).
- **Negative:** Requires disciplined database migration workflows and careful index management as tables grow.

---

## ADR 03: Row Level Security (RLS) for Multi-Tenant Isolation

### Context
Workshops demand absolute confidentiality. Application-level tenant filtering (`WHERE business_id = ?`) is prone to human error, developer oversight in complex queries, and API bypass bugs.

### Decision
Tenant isolation is enforced **at the database engine level via PostgreSQL Row Level Security (RLS)**. Supabase Auth JWTs provide `auth.uid()`, which is verified against `business_members` in RLS policies. Any query lacking proper tenant membership returns zero rows or errors out.

### Consequences
- **Positive:** Zero-trust architecture. Impossible for a rogue or poorly written query in the API layer to leak cross-tenant data.
- **Negative:** Small latency overhead on queries (mitigated by `STABLE SECURITY DEFINER` helper functions and indexing on `business_id`).

---

## ADR 04: Explicit `business_id` Placement on All Tenant Domain Tables

### Context
In multi-tenant relational databases, some architectures use indirect tenancy (e.g. `quotation_items` only has `quotation_id`, and inherits `business_id` via a JOIN to `quotations`).

### Decision
We place `business_id` explicitly on all primary tenant domain tables (`customers`, `vehicles`, `quotations`, `orders`, `audit_logs`). For subordinate line items (`quotation_items`), we enforce parent foreign key constraints to `quotations(id)`.

### Consequences
- **Positive:** Direct index lookups by `business_id`; RLS policies evaluate immediately without expensive multi-table recursive joins; trivial data partitioning or sharding in future scale phases.
- **Negative:** Slight storage redundancy for the 16-byte UUID column.

---

## 5. ADR 05: Hexagonal Adapter Pattern for Third-Party Integrations

### Context
External automotive ecosystems have extreme variance. Some suppliers expose modern REST APIs; others send CSVs over SFTP. Notifications can be SMS (Twilio), WhatsApp (Meta Cloud API), or Email (SendGrid/Resend).

### Decision
We define strict TypeScript interface ports (`NotificationProvider`, `SupplierProvider`, `PaymentProvider`). All external communications run through pluggable adapters. The core domain never imports third-party SDKs directly.

### Consequences
- **Positive:** Switching suppliers or SMS providers requires changing a single adapter file without touching quotation business logic. Unit tests mock adapters with 100% deterministic fidelity.
- **Negative:** Initial upfront boilerplate defining interfaces and DTO mappers.

---

## 6. ADR 06: Synchronous Quotation Flow with Deferred Async Processing

### Context
Workshops need immediate feedback when creating a draft quote or calculating totals. However, external supplier catalogue syncs, customer WhatsApp dispatch, and PDF generation can take hundreds of milliseconds.

### Decision
Core quotation calculations, database persistence, and status transitions occur synchronously within the Next.js API layer. External side-effects (notification delivery, audit log fanout, PDF rendering) are executed via non-blocking promises in the MVP, with an explicit migration path to an asynchronous queue (e.g. Inngest, BullMQ, or AWS SQS) as volume grows.

### Consequences
- **Positive:** Fast, simple architecture without worker infrastructure or Redis clusters.
- **Negative:** If an external SMS gateway times out, the user request must handle the fallback gracefully.

---

## 7. ADR 07: Concrete Triggers for Future Service Extraction

### Context
We must define clear, objective metrics for when the modular monolith should be broken into standalone microservices, avoiding both premature distribution and unmaintainable monolith bloat.

### Extraction Triggers:
1. **Disproportionate Resource Consumption:** When the **Parts Catalogue & Supplier Search** ingestion engine processes millions of daily SKU updates, saturating database I/O and serverless memory, it will be extracted into a dedicated `parts-catalog-service` with an Elasticsearch or Meilisearch cluster.
2. **Team Scaling Divergence:** When the engineering organization exceeds 25 engineers divided into autonomous domain squads (e.g. Core Workshop Squad vs. Supplier Logistics Squad).
3. **Different Availability / SLA Requirements:** When public customer quotation viewing and payments require 99.99% uptime during peak holiday seasons while workshop administrative tooling has lower traffic.

---

## 8. ADR 08: Architectural Evolution at 10x and 100x Scale

### Current Scale (MVP): 10–50 Workshops, 5,000 Quotes/Month
- Next.js on Vercel Serverless.
- Single Supabase PostgreSQL instance (Compute: Small / Medium).
- In-memory caching and synchronous adapters.

### 10x Scale: 500 Workshops, 50,000 Quotes/Month
- **Read Replicas:** Route read-heavy search requests (`GET /api/parts`, `GET /api/quotations`) to Supabase PostgreSQL Read Replicas.
- **Redis Caching:** Cache external supplier prices and stock levels in Upstash Redis with a 5-minute TTL.
- **Async Queue:** Inngest or QStash for background jobs (WhatsApp notification dispatch, PDF generation, supplier catalog ingestion).

### 100x Scale: 5,000+ Workshops, 500,000+ Quotes/Month, Cross-Border Expansion
- **Database Partitioning:** PostgreSQL declarative table partitioning by `business_id` or geographical region (e.g. South Africa, Kenya, Nigeria).
- **Dedicated Parts Search Cluster:** Offload parts catalog and cross-reference queries to a distributed search cluster (Typesense / OpenSearch).
- **Event-Driven Architecture:** Apache Kafka or AWS EventBridge for real-time order and telematics streaming.
