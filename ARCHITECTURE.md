# PatentSale — Architecture Decision Record & System Design

This document records the architecture decisions, the system design plan, the
ERD, the API surface, the self-review notes, the Neon region rationale, and the
DPDPA vendor / data-processing register. It is the artifact for Phase 0/1/2.6.

---

## 1. Architecture justification

| Concern | Decision | Rationale |
|---|---|---|
| Framework | Next.js 16 + TypeScript (App Router) | SSR/SSG for SEO on public marketplace pages; strong typing for a data-heavy IP domain; first-class API routes; mature ecosystem. |
| ORM | Prisma | Type-safe schema-first ORM; migrations; the schema is written to be reused as-is by the future automated Phase B. |
| Database | Neon serverless Postgres (free tier) in production; SQLite in local dev | Neon runs **outside Railway**, so it does not draw against the shared $5/mo Hobby credit that also covers 4 other apps on the same account. Free tier (100 CU-hr/mo, 0.5GB storage, 5GB egress, no card, commercial use OK) comfortably covers expected scale (a few thousand listings). |
| Caching | None (no Redis) | At expected scale, Postgres with proper indexing (fieldOfUse, jurisdiction, legalStatus, readinessScore, dates) is sufficient for marketplace browsing. Revisit only if real usage data shows it's needed (Prompt 4.5). |
| Object storage | Cloudflare R2 (S3-compatible) — **required** | Railway ephemeral storage does not persist across redeploys. No file the platform must keep is ever written to local disk. |
| Email | Single transactional provider (Resend / AWS SES / Postmark) | Every outbound email flows through one configured provider, captured to `EmailLog` for auditability. Provider-agnostic abstraction so the choice can change without touching call sites. |
| Auth | NextAuth.js v4 + TOTP MFA on the admin panel | The admin panel is the only write path to a marketplace involving money, contact details, and legal documents — password auth alone is insufficient. MFA is cheap now, expensive to retrofit after a breach. |
| Analytics | Self-hosted in the same Postgres DB | $0 additional cost; no third-party analytics service; DPDPA-aligned data minimization (anonymous session id, truncated IP, no PII correlation). |
| Frontend | Tailwind CSS 4 + shadcn/ui (New York) + Framer Motion | Modern, motion-driven, premium SaaS/fintech feel — not institutional/government-portal. Emerald/teal palette (no indigo/blue). `prefers-reduced-motion` respected. |

### Neon connection split (required)

- `DATABASE_URL` → the **pooler** hostname (`-pooler` variant) for the runtime
  app (connection pooling across serverless functions).
- `DIRECT_URL` → the **direct** (non-pooled) hostname for Prisma CLI / migrations.

This split is required for Prisma + Neon to work correctly. The local dev
environment uses SQLite, so no external DB is needed to run the project.

### Neon free-tier tradeoff

Neon's free tier scales compute to zero after ~5 minutes of inactivity, with a
cold start of ~500ms–a few seconds on the next request. At this traffic level
that is an acceptable tradeoff for $0 cost.

---

## 2. System diagram

```
                        ┌─────────────────────────────────────┐
                        │            Public visitor            │
                        └───────────────┬─────────────────────┘
                                        │  HTTPS
                                        ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      Next.js 16 (App Router) on Railway                  │
│                                                                          │
│  (public) routes                (admin) routes            API routes     │
│  /  /about  /how-it-works       /admin/login              /api/leads      │
│  /contact /faq                  /admin  (dashboard)        /api/contact    │
│  /terms /privacy /refund        /admin/leads               /api/inquiries  │
│  /patents  /patents/[id]        /admin/patents (CRUD)      /api/patents    │
│                                 /admin/inquiries           /api/analytics  │
│  + analytics-tracker            /admin/data-requests       /api/auth/*     │
│    (page_view + events,         /admin/analytics           /api/admin/*    │
│     fire-and-forget)            /admin/emails              (session-guarded)│
└───────────┬──────────────────────────────┬───────────────────────────────┘
            │                              │
            ▼                              ▼
   ┌─────────────────┐          ┌─────────────────────┐
   │   Prisma Client  │◄────────►│  EmailLog (audit)   │
   └────────┬─────────┘          └─────────────────────┘
            │
            ▼
   ┌─────────────────────────────────────────┐
   │  Postgres (Neon, prod) / SQLite (dev)   │
   │  AdminUser · Lead · Patent ·            │
   │  BuyerInquiry · ContactMessage ·        │
   │  AnalyticsEvent · DataRequest ·         │
   │  EmailLog                                │
   └─────────────────────────────────────────┘

   External (production wiring):
   • Cloudflare R2 ─ patent docs / PDFs / generated files
   • Resend/AWS SES ─ transactional email
   • Patent jurisdiction APIs ─ (Phase B, Prompt 3) automated fetch
```

---

## 3. Entity-relationship diagram (ERD)

```
AdminUser 1───* DataRequest (assignedTo)
                    │
Lead 1───0..1 Patent (lead → convertedListing; Lead.convertedListingId unique)
                    │
                    │ 1
                    │
                    * 
              BuyerInquiry (patentId → Patent, cascade delete)
              ContactMessage (standalone)
              AnalyticsEvent (patentId optional, no FK enforced — denormalized for write speed)

Patent: UNIQUE(patentNumber, jurisdiction)
        dataSource: admin-manual | self-serve-automated
        recordLocked: bool   ← protects admin data from Phase B overwrite
        scoreSource: manual | computed (Prompt 3)
        published: bool, publishedAt
        readiness inputs (all optional): claimBreadth, remainingLifeYears,
          forwardCitations, marketSizeProxy, litigationHistory, patentFamilySize
```

Key relations:
- `Lead.convertedListingId` (unique, nullable) → `Patent.id`. When a lead
  converts, the admin links it to the resulting listing. Hard-deleting a lead
  nulls `Patent.leadId` but **never** deletes the published patent.
- `BuyerInquiry.patentId` → `Patent.id` (`onDelete: Cascade`). Deleting an
  inquiry removes only the inquiry — the patent listing is untouched. (The
  cascade here is safe because inquiries are children of patents, not the other
  way around.)
- `AnalyticsEvent.patentId` is stored but **not** FK-enforced — analytics writes
  must never fail or block on referential integrity. This is a deliberate
  denormalization for non-blocking writes.
- `EmailLog` is standalone (audit trail).

---

## 4. API surface (this branch)

### Public
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/leads` | Phase A lead capture. Persists Lead, sends ack + sales emails, logs `lead_submitted`. |
| POST | `/api/contact` | Generic contact form. Persists ContactMessage, sends ack + sales emails. |
| POST | `/api/inquiries` | Buyer "Express Interest". Persists BuyerInquiry, sends ack + sales emails, logs `buyer_inquiry_submitted`. |
| POST | `/api/analytics` | Fire-and-forget event log (returns 204). Truncated IP, anonymous session id. |
| GET | `/api/patents` | Marketplace list: search, filters (fieldOfUse, jurisdiction, legalStatus, score range, date ranges), sort, pagination, facets. Returns published only. |
| GET/POST | `/api/auth/[...nextauth]` | NextAuth handler (credentials + TOTP MFA). |

### Admin (all session-guarded via `getServerSession`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/admin/dev-otp` | DEV ONLY — current TOTP for seeded admin (404 in prod). |
| GET | `/api/admin/stats` | Dashboard summary counts. |
| GET | `/api/admin/leads` · PATCH/DELETE `/api/admin/leads/[id]` | Lead list, status update, hard-delete PII (nulls Patent.leadId). |
| GET/POST | `/api/admin/patents` · GET/PATCH/DELETE `/api/admin/patents/[id]` | Patent CRUD. 409 on UNIQUE(patentNumber,jurisdiction) conflict. |
| POST | `/api/admin/patents/[id]/publish` | Toggle published (sets publishedAt). |
| POST | `/api/admin/patents/[id]/ai-summary` | On-demand AI section-summary generation (z-ai-web-dev-sdk). |
| GET | `/api/admin/inquiries` · PATCH/DELETE `/api/admin/inquiries/[id]` | Inquiry list, status, hard-delete PII. |
| GET/POST | `/api/admin/data-requests` · PATCH/DELETE `/api/admin/data-requests/[id]` | DPDPA data principal request queue. |
| GET | `/api/admin/analytics` | Aggregates: visitsOverTime, topListings, funnel counts. |
| GET | `/api/admin/emails` | EmailLog viewer. |

---

## 5. Self-review notes (Phase 1)

### What happens if the admin enters incomplete data?
- All patent fields except `patentNumber`, `jurisdiction`, and `title` are
  optional. The admin is **never** blocked from saving or publishing a listing
  because some data points were unavailable at manual-entry time.
- All readiness score *input* fields are optional. The final `readinessScore`
  itself is optional (nullable) — a listing can be published "Unrated" and
  scored later.
- AI section summaries are optional; the marketplace card falls back to the raw
  abstract if no summary exists. The admin can trigger AI generation on demand.
- The marketplace card and detail view render graceful fallbacks for every
  nullable field ("—", "Unrated", omitted rows).

### Security implications of the admin panel
- The admin panel is **not** linked from public navigation — not discoverable.
- `/admin/*` (except `/admin/login`) is protected by NextAuth `withAuth`
  middleware (`src/middleware.ts`); unauthenticated users are redirected to
  `/admin/login`. There is no path to an admin write API without a valid
  session — every `/api/admin/*` route calls `getServerSession(authOptions)`
  and returns 401 if absent.
- Login is **two-factor**: email + password (bcrypt) **and** a 6-digit TOTP
  code (RFC 6238 via otplib). A password compromise alone is insufficient.
- The dev-OTP helper that displays the current TOTP on the login page is
  hard-gated on `NODE_ENV !== "production"` and removed in production.
- `NEXTAUTH_SECRET` must be set to a strong random value in production (the dev
  default is explicitly named "change-in-production").

### Is the schema designed so Phase B can slot in without a rewrite?
Yes — this was a primary design constraint:
- `dataSource` (`admin-manual` | `self-serve-automated`) and `recordLocked`
  flags exist on every Patent. Phase B's automated fetch must check
  `recordLocked` and never overwrite admin-entered `abstract`/`claims`/
  `description`/summaries.
- `scoreSource` (`manual` | `computed`) lets Prompt 3 apply computed scoring
  only to new automated listings without retroactively overwriting scores the
  admin deliberately set.
- All readiness *input* parameters are columns now, so Prompt 3's formula
  attaches without a schema change.
- `UNIQUE(patentNumber, jurisdiction)` prevents the same patent being listed
  twice (once manual, once automated). The duplicate-attempt contract is
  defined now: the create API returns 409 "This patent is already listed in
  this jurisdiction" — Prompt 3 implements against that contract.
- AI summary generation (`lib/ai.ts`) is a reusable function Phase B calls at
  publish time.
- The `Lead` → `Patent` conversion link is in place for the future self-serve
  flow.

### Will analytics writes add meaningful load at expected traffic?
No. At a few thousand visits/month:
- Each event is one lightweight INSERT into `analytics_events` (indexed).
- Client-side tracking uses `navigator.sendBeacon` (or `fetch` with `keepalive`)
  — fire-and-forget, non-blocking, never slows page render.
- The server `logEvent` helper never throws; failures are swallowed.
- Confirmed negligible at expected scale. The `analytics_events` table is
  indexed on `eventType`, `createdAt`, `sessionId`, `patentId` for efficient
  dashboard queries. Revisit in Prompt 4.5 if real usage data shows pressure.

---

## 6. Neon region choice & data residency (Phase 2.6)

**Decision:** deploy Neon in **AWS ap-south-1 (Mumbai)**, the closest Neon
region to the primary (India-based) audience.

**Rationale:** DPDPA's cross-border transfer rules are permissive
(blacklist-based, not a hard localization requirement), so data residency is a
lower-urgency item — but the region choice is recorded here as **intentional**,
not left as Neon's default. Hosting in Mumbai minimizes latency for the
India-based sales team and buyer audience, and keeps personal data within India
where feasible, reducing the cross-border transfer surface. This choice is
deliberate and documented; it is not whatever Neon defaulted to.

---

## 7. Vendor / data-processing register (Phase 2.6)

DPDPA places liability on PatentSale (the data fiduciary), not its vendors.
This register lists every third party that touches personal data. (Maintained
informally at this stage; promote to an admin-only page in a later prompt.)

| Vendor | Service | Data touched | Purpose | Status |
|---|---|---|---|---|
| **Neon** | Serverless Postgres | Lead, BuyerInquiry, ContactMessage PII; AnalyticsEvent (anonymized); AdminUser (credentials, TOTP secret) | Primary data store | Active |
| **Cloudflare R2** | S3-compatible object storage | Patent documents / PDFs (may contain inventor names) | File persistence (Railway ephemeral storage does not persist) | Wired in Prompt 3 (schema-ready now) |
| **Resend** (or AWS SES / Postmark) | Transactional email | Lead/buyer/contact name + email + phone + message body | Acknowledgment + sales notification emails | Abstraction ready; provider key provisioning at launch |
| **Razorpay** | Payment processing | Buyer/seller payment details, billing PII | Listing fees (Prompt 2) | Prompt 2 |
| **Patent jurisdiction APIs** (USPTO / EPO / IPO) | Patent data fetch | Patent bibliographic data (public; no personal data beyond inventor names, which are public record) | Automated Phase B listing population | Prompt 3 |
| **Vercel/Next.js** (via z-ai-web-dev-sdk) | AI section summaries | Patent abstract/claims/field text (no PII — patent text is public record) | Generate marketplace card summaries on demand | Active (admin-triggered) |

**Grievance Officer** (DPDPA): Grievance Officer, PatentSale —
grievance@patentforsale.in — distinct from general Contact Us
(info@patentforsale.in). Named in the Privacy Policy and footer.

**Data retention** (summarized; full detail in Privacy Policy):
- Lead / BuyerInquiry PII: retained for active engagement + 24 months, then
  hard-deleted (admin hard-delete available now).
- Contact messages: 12 months.
- Consent records: 36 months.
- Published patent listing data: intentionally public/commercial — **not**
  subject to DPDPA erasure (erasure targets the personal contact details
  attached to leads/inquiries, not the public listing). Hard-deleting a lead
  never cascade-deletes its converted published patent.

---

## 8. DPDPA compliance foundations (built in this branch)

- **Itemized consent** at every PII touchpoint (lead form, buyer inquiry form,
  future self-serve flow): a shared `<ConsentNotice>` component states exactly
  what's collected and why, requires an explicit checkbox (NOT implied by
  submission), and links to the Privacy Policy. Consent text is snapshot-stored
  on each record.
- **Age self-declaration** ("I confirm I am 18 years of age or older") required
  at each form. The platform is intended for users 18+.
- **Grievance Officer** named with a dedicated contact distinct from general
  Contact Us.
- **Data principal request queue** in the admin panel (`/admin/data-requests`)
  to log and track access / correction / erasure / consent-withdrawal requests
  with status + resolved-by date. Manual workflow at this stage (DPDPA requires
  fulfillability, not automation).
- **Hard-delete of lead/buyer PII** in the admin panel, distinct from listing
  deletion. Deleting a lead/inquiry removes the personal contact details but
  preserves any already-published, paid listing it led to.
- **Analytics data minimization**: anonymous session id, truncated/anonymized IP
  (last octet dropped for IPv4, prefix-only for IPv6), no PII correlation,
  disclosed in the Privacy Policy.
- **Vendor register + Neon region choice** documented above.
- **Terms / Privacy / Refund** pages drafted as genuine, specific documents
  (DPDPA-itemized Privacy Policy), flagged for counsel review before launch.
