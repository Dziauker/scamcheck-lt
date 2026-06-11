// ─── ScamCheck LT v0.5 — Trend Manager validation tests ──────────────────────
//
// These guard the safety requirements for editable admin trends. They are pure
// library tests — they never touch Supabase, the engine, or public detection.

import { describe, it, expect } from 'vitest'
import {
  isRiskLevel,
  isTrendStatus,
  isPatternKind,
  validateRegex,
  validatePatternValue,
  validateWeight,
  validateNewTrendDraft,
} from '@/lib/supabase/validation'
import { RISK_LEVELS, TREND_STATUSES, PATTERN_KINDS } from '@/lib/supabase/types'

describe('enum guards', () => {
  it('accepts only allowed risk levels', () => {
    for (const level of RISK_LEVELS) expect(isRiskLevel(level)).toBe(true)
    expect(isRiskLevel('extreme')).toBe(false)
    expect(isRiskLevel('')).toBe(false)
    expect(isRiskLevel(undefined)).toBe(false)
  })

  it('accepts only allowed statuses', () => {
    for (const s of TREND_STATUSES) expect(isTrendStatus(s)).toBe(true)
    expect(isTrendStatus('published')).toBe(false)
  })

  it('accepts only allowed pattern kinds', () => {
    for (const k of PATTERN_KINDS) expect(isPatternKind(k)).toBe(true)
    expect(isPatternKind('glob')).toBe(false)
  })
})

describe('validateRegex', () => {
  it('accepts a valid regex', () => {
    const r = validateRegex('sumokek\\w*[^!?\\n]{0,40}mokest')
    expect(r.ok).toBe(true)
  })

  it('rejects an invalid regex before it could be saved', () => {
    const r = validateRegex('([unclosed')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/regex/i)
  })
})

describe('validatePatternValue', () => {
  it('rejects an unknown kind', () => {
    expect(validatePatternValue('glob', 'x').ok).toBe(false)
  })

  it('rejects an empty value', () => {
    expect(validatePatternValue('phrase', '   ').ok).toBe(false)
  })

  it('accepts a phrase and trims it', () => {
    const r = validatePatternValue('phrase', '  smart-id  ')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.value).toBe('smart-id')
  })

  it('rejects a regex value that does not compile', () => {
    expect(validatePatternValue('regex', '([nope').ok).toBe(false)
  })
})

describe('validateWeight', () => {
  it('falls back when empty', () => {
    const r = validateWeight('', 5)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toBe(5)
  })

  it('rejects non-integers and out-of-range values', () => {
    expect(validateWeight('3.5', 5).ok).toBe(false)
    expect(validateWeight('-1', 5).ok).toBe(false)
    expect(validateWeight('101', 5).ok).toBe(false)
  })

  it('accepts an in-range integer', () => {
    const r = validateWeight('7', 5)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toBe(7)
  })
})

describe('validateNewTrendDraft', () => {
  const base = {
    title_lt: 'Netikri energijos kompensacijos SMS',
    risk_level: 'auksta',
    base_weight: '6',
  }

  it('requires a Lithuanian title', () => {
    const r = validateNewTrendDraft({ ...base, title_lt: '   ' })
    expect(r.ok).toBe(false)
  })

  it('rejects an invalid risk level', () => {
    const r = validateNewTrendDraft({ ...base, risk_level: 'extreme' })
    expect(r.ok).toBe(false)
  })

  it('normalizes optional empty fields to null', () => {
    const r = validateNewTrendDraft({ ...base, title_en: '', explanation_lt: '  ' })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.title_en).toBeNull()
      expect(r.value.explanation_lt).toBeNull()
      expect(r.value.title_lt).toBe(base.title_lt)
      expect(r.value.risk_level).toBe('auksta')
      expect(r.value.base_weight).toBe(6)
    }
  })

  it('does not carry a status field (status is forced to draft by the action)', () => {
    const r = validateNewTrendDraft(base)
    expect(r.ok).toBe(true)
    if (r.ok) expect('status' in r.value).toBe(false)
  })
})
