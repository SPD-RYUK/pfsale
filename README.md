# PatentSale

> A marketplace that connects unused granted patents with buyers, licensees, and
> assignees who can commercialize them. PatentSale exists to fix discoverability:
> give sellers a real storefront for their IP, and give buyers a structured,
> evaluable marketplace instead of a static government database.

Most granted patents sit on a long list on Google Patents, rarely seen by anyone
with the means or motivation to license, buy, or build around them. PatentSale
turns those sitting ducks into discoverable, evaluable, actionable commercial
opportunities.

This branch (`feature/lead-capture-flow`) covers the foundational setup, the
core informational site, the manually-operated intake flow (Phase A) with an
admin panel behind it, the full public marketplace, a manually-assigned
commercial readiness score, and a lightweight self-hosted analytics layer.

---

## Tech stack & architecture decisions

See **[ARCHITECTURE.md](./ARCHITECTURE.md)** for the full system design, ERD,
API surface, self-review notes, the Neon region rationale, and the DPDPA vendor
register. Summary:

- **Next.js 16 + TypeScript** (App Router). SSR/SSG for SEO on public marketplace
  pages; strong typing for a data-heavy domain.
- **Prisma ORM**. Local dev uses SQLite; production targets **Neon serverless
  Postgres** (free tier — see below). The schema is written to be Postgres-
  compatible and is reused as-is by the future automated Phase B.
- **No Redis / caching layer** for now. At expected scale (a few thousand
  listings, modest visitor counts), Postgres with proper indexing is sufficient.
  Revisit only if real usage data shows it's needed.
- **S3-compatible object storage (Cloudflare R2)** for any patent documents /
  PDFs / generated files. **This is a hard requirement, not an option**: the app
  deploys on Railway, where local/ephemeral storage does not persist across
  redeploys. No file the platform must keep is ever written to local disk.
- **Transactional email** via a single configured provider (Resend / AWS SES /
  Postmark). Every outbound email — lead acknowledgment, sales notification,
  buyer inquiry notification, contact acknowledgment, and (future) payment /
  listing-live emails — flows through one provider, captured to an `EmailLog`
  table for auditability.

### Why Neon (free tier) over Railway managed Postgres

PatentSale shares a $5/mo Railway Hobby budget with 4 other simple landing pages
under the same account. Neon's free tier (100 CU-hours/month, 0.5GB storage, 5GB
egress, no credit card, commercial use allowed) runs **outside Railway**, so it
does not draw against that shared credit. At the expected scale, the free tier
comfortably covers this project's needs.

**Tradeoff to be aware of:** Neon's free tier scales compute to zero after ~5
minutes of inactivity, with a cold start of roughly 500ms to a few seconds on the
next request. At this traffic level that is an acceptable tradeoff for $0 cost.

**Connection split (required for Prisma + Neon):**
- `DATABASE_URL` → the **pooler** hostname (`-pooler` variant) for the runtime
  app connection (pooled).
- `DIRECT_URL` → the **direct** (non-pooled) hostname for Prisma CLI / migration
  commands.

The local dev environment uses SQLite (`file:...`) so no external database is
required to run the project.

---

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
#   → edit .env: set NEXTAUTH_SECRET, admin credentials, email

# 3. Create the database schema
npm run db:push

# 4. Seed the full marketplace — 223 real patents (211 IIT-fetched + 12 curated)
#    + admin user. Uses the bundled dataset (prisma/data/patents.json) — no
#    live Google Patents access required.
npx tsx prisma/seed-patents.ts
#   → prints the admin email and password (MFA disabled)

#    Optional extras: a sample lead + re-affirm the 12 curated showcase patents
npx tsx prisma/seed.ts

# 5. Start the dev server (port 3000)
npm run dev
```

### Admin panel access

The admin panel lives at `/admin` (not linked from public navigation). It is
protected by NextAuth (server-side session check in the admin layout) and is
never reachable by unauthenticated users.

- URL: `/admin/login`
- Default seeded credentials: `admin@patentforsale.in` / `PatentSale123!`
- MFA/OTP is currently **disabled** — login is email + password only. The TOTP
  infrastructure (mfaSecret, otplib) remains in place and can be re-enabled by
  setting `mfaEnabled: true` on the admin record.

---

## Project structure

```
prisma/
  schema.prisma          # Full schema (Phase B-ready): AdminUser, Lead, Patent,
                         # BuyerInquiry, ContactMessage, AnalyticsEvent,
                         # DataRequest, EmailLog. UNIQUE(patentNumber,jurisdiction).
  data/
    patents.json         # Bundled validated dataset (223 real patents) — lets a
                         # fresh clone seed the full marketplace offline.
  fetch-patents.ts       # v3 robust Google Patents pipeline: search → fetch →
                         # validate (title/abstract/claims/description gates,
                         # ≥2 numbered claims, full anchor-based section parsing).
  seed-patents.ts        # Seeds validated patents (bundled data or fresh fetch),
                         # enriches (AI summaries, readiness score, stage), upserts.
  seed.ts                # Idempotent seed: admin + 12 curated patents + 1 lead
src/
  app/
    (public)/            # Public site shell (navbar + sticky footer)
      page.tsx           # Home (problem/solution narrative, motion, featured)
      about/ how-it-works/ contact/ faq/
      terms/ privacy/ refund/   # DPDPA-compliant legal pages
      patents/           # Marketplace list + [id] detail
    (admin)/             # Admin shell (sidebar, session-guarded)
      admin/             # login, dashboard, leads, patents CRUD, inquiries,
                         # data-requests, analytics, emails
    api/
      leads/ contact/ inquiries/ analytics/   # public write APIs
      patents/           # public marketplace list API
      auth/[...nextauth] # NextAuth handler
      admin/             # session-guarded admin APIs
  components/
    site/                # navbar, footer, motion, score-gauge, consent-notice,
                         # lead-form, lead-modal, animated-counter, info/
    marketplace/         # patent-card, marketplace-explorer, buyer-inquiry-form,
                         # inquiry-dialog, claim-structure, detail-charts
    admin/               # admin-shell, patent-form, leads/inquiries tables,
                         # data-requests-manager, analytics-dashboard, stat-card
    analytics/           # analytics-tracker (client page_view + events)
  lib/
    db.ts auth.ts email.ts ai.ts analytics.ts consent.ts format.ts
  middleware.ts          # withAuth protects /admin/* (excludes /admin/login)
```

---

## Key domain concepts

- **Lead** — a seller's "Request Now" submission (Phase A). Minimum friction:
  name, email, phone, patent number. DPDPA consent + age declaration required.
  Persisted to DB; sales team follows up manually. No payment, no auto-fetch.
- **Patent listing** — the full bibliographic record (title, abstract, claims,
  description, field of use, inventors, assignee, dates, legal status, family
  size) plus AI section summaries and the commercial readiness score. UNIQUE on
  `(patentNumber, jurisdiction)`. Carries `dataSource` (`admin-manual` |
  `self-serve-automated`) and `recordLocked` so the future automated Phase B
  never silently overwrites admin-entered data.
- **Commercial readiness score** — a buyer-facing signal of commercial viability.
  In this phase it is **manually assigned** by the PatentSale team (0–100),
  labeled "Assigned by PatentSale team" on the UI. The score *input parameters*
  (claim breadth, remaining life, forward citations, market size, litigation
  history, family size) are defined in the schema as optional fields now so
  Prompt 3 can attach a formula later without a schema change. `scoreSource` is
  `manual` today; Prompt 3 introduces `computed`.
- **Buyer inquiry** — a buyer's "Express Interest" submission from a patent
  detail page. Linked to both the buyer and the patent. Same DPDPA consent
  pattern as the lead form (reused shared component).
- **Analytics events** — self-hosted, DPDPA-aligned. Anonymous session id,
  truncated/anonymized IP (last octet dropped), no PII. Distinct `event_type`
  values enable a real funnel view (visits → listing views → request_now_opened
  → lead_submitted; visits → listing views → express_interest_opened →
  buyer_inquiry_submitted).
- **Data requests** — DPDPA data principal request queue (access / correction /
  erasure / consent withdrawal), tracked manually in the admin panel. Hard-delete
  of lead/buyer PII is available in the admin panel and never cascade-deletes a
  published patent listing.

## Conventions

- Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`). `main` stays
  stable and deployable; feature work happens on branches.
- TypeScript throughout. shadcn/ui (New York) for components. Tailwind CSS 4.
- No indigo/blue palette — emerald/teal primary (premium SaaS/fintech feel).
- Mobile-first responsive throughout. Sticky footer (`min-h-screen flex flex-col`
  + `mt-auto`). `prefers-reduced-motion` respected.

## Legal note

The Terms of Service, Privacy Policy (DPDPA), and Refund Policy are drafted as
genuine, specific documents — not templates — but **must be reviewed by qualified
counsel before launch**. The Privacy Policy in particular itemizes data
collected at each touchpoint, names a Grievance Officer, describes data
principal rights and retention, and discloses the self-hosted analytics
tracking. This README and the policy drafts are guidance, not a substitute for
that legal review.
