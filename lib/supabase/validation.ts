// ─── ScamCheck LT v0.5 — Trend Manager input validation ──────────────────────
//
// Pure, dependency-free validators shared by the server actions. They guard the
// safety requirements for editable trends:
//   * only allowed risk levels / statuses / pattern kinds are accepted,
//   * regex pattern values must compile before they can ever be saved,
//   * weights are bounded integers,
//   * required Lithuanian text is present.
//
// Messages are in Lithuanian because they surface in the internal admin UI.

import {
  RISK_LEVELS,
  TREND_STATUSES,
  PATTERN_KINDS,
  DbRiskLevel,
  TrendStatus,
  PatternKind,
  NewTrendDraft,
} from './types'

export type Validated<T> = { ok: true; value: T } | { ok: false; error: string }

// ─── Enum guards ─────────────────────────────────────────────────────────────

export function isRiskLevel(v: unknown): v is DbRiskLevel {
  return typeof v === 'string' && (RISK_LEVELS as readonly string[]).includes(v)
}

export function isTrendStatus(v: unknown): v is TrendStatus {
  return typeof v === 'string' && (TREND_STATUSES as readonly string[]).includes(v)
}

export function isPatternKind(v: unknown): v is PatternKind {
  return typeof v === 'string' && (PATTERN_KINDS as readonly string[]).includes(v)
}

// ─── Field validators ────────────────────────────────────────────────────────

// Confirms a regex pattern compiles with the same flags the engine uses ('i').
// This is the guard behind "validate regex before saving".
export function validateRegex(value: string): Validated<string> {
  try {
    // eslint-disable-next-line no-new
    new RegExp(value, 'i')
    return { ok: true, value }
  } catch (e) {
    return { ok: false, error: `Netaisyklinga regex išraiška: ${(e as Error).message}` }
  }
}

// Validates a single pattern value for its kind. Phrase values just have to be
// non-empty; regex values must additionally compile.
export function validatePatternValue(kind: unknown, value: unknown): Validated<{ kind: PatternKind; value: string }> {
  if (!isPatternKind(kind)) {
    return { ok: false, error: `Neleistinas šablono tipas. Galimi: ${PATTERN_KINDS.join(', ')}.` }
  }
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) return { ok: false, error: 'Šablono reikšmė negali būti tuščia.' }
  if (kind === 'regex') {
    const re = validateRegex(text)
    if (!re.ok) return re
  }
  return { ok: true, value: { kind, value: text } }
}

// Bounded integer weight (matches the DB check constraint 0..100).
export function validateWeight(raw: unknown, fallback: number): Validated<number> {
  if (raw === null || raw === undefined || raw === '') return { ok: true, value: fallback }
  const n = typeof raw === 'number' ? raw : Number(String(raw).trim())
  if (!Number.isInteger(n)) return { ok: false, error: 'Svoris turi būti sveikasis skaičius.' }
  if (n < 0 || n > 100) return { ok: false, error: 'Svoris turi būti tarp 0 ir 100.' }
  return { ok: true, value: n }
}

// ─── Composite: new trend draft ──────────────────────────────────────────────

function optionalText(raw: unknown): string | null {
  const s = typeof raw === 'string' ? raw.trim() : ''
  return s.length > 0 ? s : null
}

// Validates and normalizes the raw FormData values for a new trend. Status is
// NOT taken from input here — the action forces 'draft'.
export function validateNewTrendDraft(raw: {
  title_lt?: unknown
  title_en?: unknown
  title_de?: unknown
  title_ru?: unknown
  explanation_lt?: unknown
  scammer_goal_lt?: unknown
  safe_action_lt?: unknown
  risk_level?: unknown
  base_weight?: unknown
  created_by?: unknown
}): Validated<NewTrendDraft> {
  const titleLt = typeof raw.title_lt === 'string' ? raw.title_lt.trim() : ''
  if (!titleLt) return { ok: false, error: 'Laukas „Pavadinimas (LT)" yra privalomas.' }

  if (!isRiskLevel(raw.risk_level)) {
    return { ok: false, error: `Neleistinas rizikos lygis. Galimi: ${RISK_LEVELS.join(', ')}.` }
  }

  const weight = validateWeight(raw.base_weight, 5)
  if (!weight.ok) return weight

  return {
    ok: true,
    value: {
      title_lt: titleLt,
      title_en: optionalText(raw.title_en),
      title_de: optionalText(raw.title_de),
      title_ru: optionalText(raw.title_ru),
      explanation_lt: optionalText(raw.explanation_lt),
      scammer_goal_lt: optionalText(raw.scammer_goal_lt),
      safe_action_lt: optionalText(raw.safe_action_lt),
      risk_level: raw.risk_level,
      base_weight: weight.value,
      created_by: optionalText(raw.created_by),
    },
  }
}
