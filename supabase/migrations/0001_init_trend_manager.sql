-- ─── ScamCheck LT v0.5 — Admin Trend Manager schema ──────────────────────────
--
-- Editable, admin-managed scam trends live in Supabase as an OVERLAY on top of
-- the static, version-controlled knowledge base (knowledge/scamPatterns.ts +
-- knowledge/riskSignals.ts), which remains the trusted baseline for the live
-- detection engine.
--
-- SAFETY MODEL (v0.5 — foundation step):
--   * New trends ALWAYS default to status 'draft'.
--   * Draft trends never affect public detection.
--   * Even 'active' DB trends do NOT affect the engine yet — engine wiring is a
--     deliberate later step, gated behind tests and explicit approval.
--   * There is no hard delete in the app; trends are retired via status
--     'disabled' (the schema allows DELETE only for manual DB maintenance).
--
-- ACCESS MODEL:
--   * RLS is ENABLED on every table and NO policies are defined, so the public
--     `anon` / `authenticated` roles can read nothing.
--   * All app access goes through server-only code using the Supabase
--     service-role key, which bypasses RLS. The service-role key must never be
--     exposed to the browser (never prefix it NEXT_PUBLIC_).
--
-- Apply via the Supabase SQL editor (Dashboard → SQL) or the Supabase CLI:
--   supabase db execute --file supabase/migrations/0001_init_trend_manager.sql
-- The script is written to be safely re-runnable.

-- ─── Enums ────────────────────────────────────────────────────────────────────
-- Wrapped so the migration can be re-run without erroring on existing types.

do $$ begin
  create type trend_status as enum ('draft', 'active', 'disabled');
exception when duplicate_object then null; end $$;

do $$ begin
  -- Mirrors lib/types.ts RiskLevel exactly: zema | vidutine | auksta | kritine.
  create type risk_level as enum ('zema', 'vidutine', 'auksta', 'kritine');
exception when duplicate_object then null; end $$;

do $$ begin
  create type pattern_kind as enum ('phrase', 'regex');
exception when duplicate_object then null; end $$;

-- ─── updated_at trigger helper ───────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── scam_trends ─────────────────────────────────────────────────────────────
-- One row = one admin-managed scam trend (the overlay analogue of a
-- ScamCategory in knowledge/scamPatterns.ts).

create table if not exists scam_trends (
  id              uuid primary key default gen_random_uuid(),
  title_lt        text        not null,
  title_en        text,
  title_de        text,
  title_ru        text,
  explanation_lt  text,
  scammer_goal_lt text,
  safe_action_lt  text,
  risk_level      risk_level   not null default 'vidutine',
  base_weight     integer      not null default 5 check (base_weight between 0 and 100),
  status          trend_status not null default 'draft',
  created_at      timestamptz  not null default now(),
  updated_at      timestamptz  not null default now(),
  created_by      text,
  updated_by      text
);

create index if not exists idx_scam_trends_status     on scam_trends (status);
create index if not exists idx_scam_trends_updated_at on scam_trends (updated_at desc);

drop trigger if exists trg_scam_trends_updated_at on scam_trends;
create trigger trg_scam_trends_updated_at
  before update on scam_trends
  for each row execute function set_updated_at();

-- ─── scam_patterns ───────────────────────────────────────────────────────────
-- Weighted phrase/regex patterns belonging to a trend (overlay analogue of
-- ScamPattern). `value` is matched against NORMALIZED text once a trend is wired
-- into the engine in a later step (lowercase, Lithuanian diacritics stripped).

create table if not exists scam_patterns (
  id          uuid primary key default gen_random_uuid(),
  trend_id    uuid         not null references scam_trends (id) on delete cascade,
  kind        pattern_kind not null,
  value       text         not null,
  weight      integer      not null default 2 check (weight between 0 and 100),
  is_critical boolean      not null default false,
  language    text         not null default 'lt',
  notes       text,
  created_at  timestamptz  not null default now(),
  updated_at  timestamptz  not null default now()
);

create index if not exists idx_scam_patterns_trend_id on scam_patterns (trend_id);

drop trigger if exists trg_scam_patterns_updated_at on scam_patterns;
create trigger trg_scam_patterns_updated_at
  before update on scam_patterns
  for each row execute function set_updated_at();

-- ─── trend_examples ──────────────────────────────────────────────────────────
-- Example messages for a trend, used for documentation and (later) regression
-- testing of an activated trend.

create table if not exists trend_examples (
  id                  uuid primary key default gen_random_uuid(),
  trend_id            uuid        not null references scam_trends (id) on delete cascade,
  example_text        text        not null,
  language            text        not null default 'lt',
  expected_risk_level risk_level,
  notes               text,
  created_at          timestamptz not null default now()
);

create index if not exists idx_trend_examples_trend_id on trend_examples (trend_id);

-- ─── admin_audit_log ─────────────────────────────────────────────────────────
-- Append-only trail of admin write actions. Intentionally has NO foreign key to
-- scam_trends so the audit history survives even if a trend row is later
-- removed during manual DB maintenance.

create table if not exists admin_audit_log (
  id           uuid        primary key default gen_random_uuid(),
  admin_action text        not null,
  entity_type  text        not null,
  entity_id    uuid,
  before_json  jsonb,
  after_json   jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists idx_admin_audit_log_created_at on admin_audit_log (created_at desc);
create index if not exists idx_admin_audit_log_entity     on admin_audit_log (entity_type, entity_id);

-- ─── Row Level Security ──────────────────────────────────────────────────────
-- Enable RLS everywhere and define NO policies → anon/authenticated can read or
-- write nothing. The service-role key (used only by server-side app code)
-- bypasses RLS, so the Trend Manager keeps working while the public is locked
-- out by default.

alter table scam_trends     enable row level security;
alter table scam_patterns   enable row level security;
alter table trend_examples  enable row level security;
alter table admin_audit_log enable row level security;
