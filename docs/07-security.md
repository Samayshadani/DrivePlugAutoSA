# DrivePlugAutoSA - Security Architecture & Threat Model

**Document Version:** 1.0.0  
**Compliance Baseline:** POPIA (South Africa), GDPR Principles, OWASP Top 10 (2021)  
**Threat Modeling Methodology:** STRIDE  

---

## 1. Threat Modeling (STRIDE Analysis)

| Threat Category | Automotive Platform Risk | Mitigations in DrivePlugAutoSA |
| :--- | :--- | :--- |
| **Spoofing** | Adversary impersonates a workshop manager or customer. | Supabase Auth JWT with short-lived access tokens, secure HttpOnly cookies, MFA support for admin roles. |
| **Tampering** | Man-in-the-middle alters quotation pricing or supplier part SKUs. | HTTPS enforced end-to-end; HMAC-SHA256 signatures on webhooks; database triggers check immutable price fields once status is `APPROVED`. |
| **Repudiation** | Workshop claims it never authorized an expensive parts order. | Immutable `audit_logs` record containing user ID, timestamp, IP address, and payload snapshot. |
| **Information Disclosure** | Workshop A snoops on Workshop B's quotes, margins, or customer contact info. | PostgreSQL Row Level Security (RLS) physically enforced at the database kernel. Service role keys quarantined to server-side only. |
| **Denial of Service** | Bot flooding quotation creation or external supplier search APIs. | In-memory / Upstash rate limiting (e.g. 60 requests/minute per IP/tenant), Zod payload size limits, request timeouts. |
| **Elevation of Privilege** | Workshop technician (`STAFF`) elevates to `OWNER` to change bank details or delete records. | Database RLS policies and backend API middleware strictly check `has_business_role()` with active membership. |

---

## 2. Secrets Management & Key Hierarchy

| Secret Name | Scope | Permitted Environment | Danger Level & Exposure Policy |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public / Client | Frontend & Backend | Safe. Points to Supabase project API gateway. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public / Client | Frontend & Backend | Safe. Bound by PostgreSQL RLS. Cannot access data without valid policies. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Confidential** | **Backend Only** (Route Handlers / Migrations) | **CRITICAL.** Completely bypasses RLS. **NEVER** prefix with `NEXT_PUBLIC_`. Never bundle in client builds. |
| `WEBHOOK_SIGNING_SECRET` | **Confidential** | Backend Only | Used to verify HMAC signatures for supplier callbacks and payments. |

---

## 3. Defense-in-Depth Authentication & Session Flow

1. **Client Authentication:**
   Supabase Auth exchanges credentials (email/password or OTP magic link) for a signed JWT containing `auth.uid()`, email, and expiration (`exp`).
2. **Session Persistence:**
   Tokens are stored in standard Secure, `SameSite=Lax`, `HttpOnly` cookies.
3. **Tenant Context Assertion:**
   Client requests pass the target tenant ID via `x-business-id`. The server asserts that `business_members` contains an active record for `(auth.uid(), business_id)`. If absent, HTTP `403 Forbidden` is returned immediately.
4. **RLS Kernel Boundary:**
   Even if an attacker crafts an arbitrary REST payload with another tenant's `business_id`, the PostgreSQL RLS policy `business_id IN (SELECT get_auth_business_ids())` filters the record or blocks the write.

---

## 4. OWASP Top 10 Mitigations

1. **A01: Broken Access Control:** Multi-tenant RLS + RBAC helper functions. RLS tests run on every pull request.
2. **A02: Cryptographic Failures:** Passwords hashed with Argon2 via Supabase Auth; Webhook signatures verified via timing-safe HMAC-SHA256; TLS 1.3 in transit.
3. **A03: Injection (SQL / NoSQL / Command):** 100% parameterized queries via Supabase PostgREST client and PostgreSQL query planner. Zero raw string interpolation.
4. **A04: Insecure Design:** Strict quotation state machine (illegal states like `APPROVED -> DRAFT` are rejected by code and database check constraints).
5. **A05: Security Misconfiguration:** Strict CORS policy allowing only authorized domains. CSP headers configured in Next.js `middleware.ts`.
6. **A07: Identification & Authentication Failures:** Rate-limited authentication endpoints. Session invalidation on password change.
7. **A08: Software & Data Integrity Failures:** Zod runtime validation rejects unexpected fields, enforcing strict schema parsing.
8. **A09: Security Logging & Monitoring:** Structured JSON logs; mutations logged to `audit_logs`.

---

## 5. PII & Regulatory Compliance (POPIA / GDPR)

Automotive data frequently qualifies as Personally Identifiable Information:
- **Customer Personal Info:** Name, mobile number, physical address, national ID.
- **Vehicle Identifiers:** Vehicle Identification Number (VIN) and license plate are legally linkable to vehicle owners.

**Measures:**
- Data retention policies: customer records can be pseudonymized upon verified right-to-be-forgotten requests.
- Customer vehicle history remains intact for safety recall obligations while PII is scrubbed.
- All database volumes encrypted at rest with AES-256 in Supabase.
