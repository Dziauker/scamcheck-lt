# Supabase — ScamCheck LT Admin Trend Manager (v0.5)

This folder holds the database foundation for **admin-managed scam trends**. It
is an **overlay** on top of the static, version-controlled knowledge base
(`knowledge/scamPatterns.ts` + `knowledge/riskSignals.ts`), which remains the
trusted baseline for the live detection engine.

## Safety model (v0.5 foundation step)

- New trends **always** default to status `draft`.
- Draft trends **do not** affect public detection.
- Even `active` DB trends **do not** affect the engine yet — wiring activated
  trends into `lib/scamEngine.ts` is a deliberate **later step**, gated behind
  tests and explicit approval.
- No hard delete in the app — trends are retired via status `disabled`.
- The public scam-checking flow does not import any Supabase code, so it keeps
  working unchanged whether or not Supabase is configured.

## Tables

| Table             | Purpose                                                        |
| ----------------- | ------------------------------------------------------------- |
| `scam_trends`     | One editable scam trend (overlay analogue of a `ScamCategory`)|
| `scam_patterns`   | Weighted phrase/regex patterns belonging to a trend           |
| `trend_examples`  | Example messages for a trend (docs + future regression tests) |
| `admin_audit_log` | Append-only trail of admin write actions                      |

Full schema, enums, indexes, RLS and triggers:
[`migrations/0001_init_trend_manager.sql`](migrations/0001_init_trend_manager.sql).

## One-time setup

### 1. Create a Supabase project

At <https://supabase.com> create a project and note, from
**Project Settings → API**:

- **Project URL** → `SUPABASE_URL` (e.g. `https://abcdxyz.supabase.co`)
- **service_role key** (under *Project API keys*) → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Apply the migration

Open **SQL Editor** in the Supabase dashboard, paste the contents of
`migrations/0001_init_trend_manager.sql`, and run it. (The script is
re-runnable.)

Or with the Supabase CLI:

```bash
supabase db execute --file supabase/migrations/0001_init_trend_manager.sql
```

### 3. Configure environment variables

**Locally** — add to `.env.local` (gitignored, never committed):

```bash
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

**Production (Vercel)** — Project → **Settings → Environment Variables**, add the
same two keys (Production + Preview as needed), then redeploy.

If either variable is missing, the Trend Manager shows a calm *"Supabase
nesukonfigūruotas"* state and the rest of the app is unaffected.

## Environment variables — what is secret

| Variable                    | Secret? | Where           | Notes                                                            |
| --------------------------- | ------- | --------------- | ---------------------------------------------------------------- |
| `SUPABASE_URL`              | No      | Server only     | Project URL. Kept server-side; not needed in the browser in v0.5.|
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Server only     | Bypasses RLS. **Never** prefix `NEXT_PUBLIC_`. Never log it.      |
| `ADMIN_PASSWORD`            | **Yes** | Server only     | Existing admin gate (unchanged).                                 |

⚠️ **Never** create a `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` (or any
`NEXT_PUBLIC_*` secret). Anything `NEXT_PUBLIC_*` is inlined into client
JavaScript and visible to everyone.

## Access & RLS

- RLS is **enabled** on every table with **no policies**, so the public
  `anon` / `authenticated` roles can read/write nothing.
- All app access runs **server-side only** (server components + server actions in
  `app/admin/trends/`) through `lib/supabase/trendsRepo.ts`, using the
  service-role key, which bypasses RLS.
- The data layer uses plain `fetch` against the Supabase REST (PostgREST)
  endpoint — no `@supabase/supabase-js` dependency is added.

## What works now vs. later

**Now (v0.5):** create `draft` trends, list trends with Draft/Active/Disabled
status, append-only audit log, input validation (allowed risk levels/statuses/
kinds, regex compiles before saving, bounded weights).

**Later (separate, approved steps):**

1. Pattern & example CRUD (uses `validatePatternValue` / `validateRegex`).
2. Editing and the `draft → active → disabled` lifecycle.
3. Wiring `status = 'active'` trends into `lib/scamEngine.ts` as an additive
   overlay (the engine takes `maxLevel`, so an overlay can only raise risk, never
   lower it), behind tests and explicit approval.
