// ─── ScamCheck LT v0.5 — Trend Manager DB types ──────────────────────────────
//
// TypeScript mirrors of the Supabase tables created in
// supabase/migrations/0001_init_trend_manager.sql. The allowed-value tuples are
// the single source of truth for validation (lib/supabase/validation.ts) and
// for the admin UI selects.

// Mirrors lib/types.ts RiskLevel and the `risk_level` Postgres enum.
export const RISK_LEVELS = ['zema', 'vidutine', 'auksta', 'kritine'] as const
export type DbRiskLevel = (typeof RISK_LEVELS)[number]

// Mirrors the `trend_status` Postgres enum.
export const TREND_STATUSES = ['draft', 'active', 'disabled'] as const
export type TrendStatus = (typeof TREND_STATUSES)[number]

// Mirrors the `pattern_kind` Postgres enum.
export const PATTERN_KINDS = ['phrase', 'regex'] as const
export type PatternKind = (typeof PATTERN_KINDS)[number]

export interface ScamTrendRow {
  id: string
  title_lt: string
  title_en: string | null
  title_de: string | null
  title_ru: string | null
  explanation_lt: string | null
  scammer_goal_lt: string | null
  safe_action_lt: string | null
  risk_level: DbRiskLevel
  base_weight: number
  status: TrendStatus
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface ScamPatternRow {
  id: string
  trend_id: string
  kind: PatternKind
  value: string
  weight: number
  is_critical: boolean
  language: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface TrendExampleRow {
  id: string
  trend_id: string
  example_text: string
  language: string
  expected_risk_level: DbRiskLevel | null
  notes: string | null
  created_at: string
}

export interface AdminAuditLogRow {
  id: string
  admin_action: string
  entity_type: string
  entity_id: string | null
  before_json: unknown | null
  after_json: unknown | null
  created_at: string
}

// Fields accepted when creating a trend. `status` is deliberately absent — the
// server action always forces 'draft' (new trends never go live on creation).
export interface NewTrendDraft {
  title_lt: string
  title_en: string | null
  title_de: string | null
  title_ru: string | null
  explanation_lt: string | null
  scammer_goal_lt: string | null
  safe_action_lt: string | null
  risk_level: DbRiskLevel
  base_weight: number
  created_by: string | null
}

// Payload for an append-only audit-log entry.
export interface AuditLogEntry {
  admin_action: string
  entity_type: string
  entity_id: string | null
  before_json: unknown | null
  after_json: unknown | null
}
