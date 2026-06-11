import { describe, it, expect } from 'vitest'
import { getMockAnalysis } from '@/lib/mockAnalysis'
import { analyzeScamText, RISK_LEVEL_ORDER } from '@/lib/scamEngine'
import { normalizeLt } from '@/lib/textNormalize'
import { SCAM_TEST_CASES } from '@/knowledge/testCases'
import { SCAM_CATEGORIES } from '@/knowledge/scamPatterns'
import { DEMO_EXAMPLES } from '@/constants/demoExamples'
import { RiskLevel, SubmissionInput } from '@/lib/types'

const levelIdx = (l: RiskLevel) => RISK_LEVEL_ORDER.indexOf(l)

function analyze(input: Partial<SubmissionInput> & { text: string }) {
  return getMockAnalysis({
    category: 'other',
    situation: 'none',
    ...input,
  })
}

// ─── Text normalization ──────────────────────────────────────────────────────

describe('normalizeLt', () => {
  it('lowercases and strips Lithuanian diacritics', () => {
    expect(normalizeLt('Ąžuolas ČĘĖĮŠŲŪŽ')).toBe('azuolas ceeisuuz')
    expect(normalizeLt('Sumokėkite mokestį')).toBe('sumokekite mokesti')
    expect(normalizeLt('paskyra UŽBLOKUOTA')).toBe('paskyra uzblokuota')
  })

  it('leaves non-Lithuanian text unchanged apart from case', () => {
    expect(normalizeLt('Hello World 123 €')).toBe('hello world 123 €')
  })
})

// ─── Knowledge base test cases (positive + negative) ─────────────────────────

describe('knowledge base test cases', () => {
  for (const tc of SCAM_TEST_CASES) {
    it(`${tc.id} — ${tc.description}`, () => {
      const result = analyze({ text: tc.text, category: tc.category, url: tc.url })

      expect(
        levelIdx(result.risk_level),
        `expected at least "${tc.expectMinLevel}", got "${result.risk_level}"`,
      ).toBeGreaterThanOrEqual(levelIdx(tc.expectMinLevel))

      if (tc.expectMaxLevel) {
        expect(
          levelIdx(result.risk_level),
          `expected at most "${tc.expectMaxLevel}", got "${result.risk_level}" (false positive)`,
        ).toBeLessThanOrEqual(levelIdx(tc.expectMaxLevel))
      }

      if (tc.expectCategories) {
        const detectedIds = (result.detected_scam_types ?? []).map(d => d.id)
        for (const expected of tc.expectCategories) {
          expect(
            detectedIds,
            `expected scam type "${expected}" to be detected, got: [${detectedIds.join(', ')}]`,
          ).toContain(expected)
        }
      }
    })
  }
})

// ─── v0.1 behavior preservation — demo examples keep their exact levels ──────

describe('v0.1 demo examples keep their risk levels', () => {
  const EXPECTED_V01_LEVELS: Record<string, RiskLevel> = {
    vinted_pay:    'kritine',
    lp_address:    'kritine',
    dpd_fee:       'kritine',
    bank_smartid:  'kritine',
    rent_deposit:  'kritine',
    normal_vinted: 'zema',
  }

  for (const ex of DEMO_EXAMPLES) {
    const expected = EXPECTED_V01_LEVELS[ex.id]
    it(`${ex.id} → ${expected}`, () => {
      expect(expected, `add expected level for new demo example "${ex.id}"`).toBeDefined()
      const result = analyze({
        text: ex.text,
        category: ex.category,
        situation: ex.situation,
        url: ex.url,
      })
      expect(result.risk_level).toBe(expected)
    })
  }
})

// ─── Hard critical-risk invariants ───────────────────────────────────────────

describe('critical-risk invariants', () => {
  it('Smart-ID request is always kritinė', () => {
    const r = analyze({ text: 'Patvirtinkite tapatybę Smart-ID kodu.', category: 'sms' })
    expect(r.risk_level).toBe('kritine')
  })

  it('card detail request is always kritinė', () => {
    const r = analyze({ text: 'Įveskite kortelės numerį ir CVV kodą formoje.', category: 'sms' })
    expect(r.risk_level).toBe('kritine')
  })

  it('bank login request is always kritinė', () => {
    const r = analyze({ text: 'Įveskite banko prisijungimo duomenis čia.', category: 'email' })
    expect(r.risk_level).toBe('kritine')
  })

  it('URL + payment language is kritinė', () => {
    const r = analyze({ text: 'Sumokėkite 1 EUR čia: http://x-pay.top', category: 'sms' })
    expect(r.risk_level).toBe('kritine')
  })

  it('brand-impersonation URL is kritinė', () => {
    const r = analyze({
      text: 'Patikrinkite savo siuntą.',
      category: 'sms',
      url: 'https://vinted-pay-lt.com/confirm',
    })
    expect(r.risk_level).toBe('kritine')
  })

  it('user already entered card → kritinė regardless of text', () => {
    const r = analyze({ text: 'Gavau žinutę apie nuolaidų kuponą.', situation: 'entered_card' })
    expect(r.risk_level).toBe('kritine')
  })

  it('user already sent money → kritinė regardless of text', () => {
    const r = analyze({ text: 'Gavau žinutę apie nuolaidų kuponą.', situation: 'sent_money' })
    expect(r.risk_level).toBe('kritine')
  })

  it('user confirmed Smart-ID → kritinė regardless of text', () => {
    const r = analyze({ text: 'Gavau žinutę apie nuolaidų kuponą.', situation: 'confirmed_smartid' })
    expect(r.risk_level).toBe('kritine')
  })

  it('clicked link upgrades zema to at least vidutinė', () => {
    const r = analyze({ text: 'Labas, kaip sekasi šiandien?', situation: 'clicked_link' })
    expect(levelIdx(r.risk_level)).toBeGreaterThanOrEqual(levelIdx('vidutine'))
  })

  it('kritinė safe_reply contains the required warning wording', () => {
    const r = analyze({ text: 'SEB: patvirtinkite tapatybę su Smart-ID kodu.', category: 'sms' })
    expect(r.safe_reply).toContain('Nerekomenduojama atrašyti')
    expect(r.safe_reply).toContain('blokuokite siuntėją')
  })
})

// ─── Engine behavior ─────────────────────────────────────────────────────────

describe('scam engine', () => {
  it('returns zema and no detections for harmless text', () => {
    const r = analyzeScamText('Labas rytas, kaip sekasi? Susitinkam vakare.', 'other', false)
    expect(r.level).toBe('zema')
    expect(r.detectedTypes).toHaveLength(0)
    expect(r.score).toBe(0)
  })

  it('detection works without Lithuanian diacritics', () => {
    const withDiacritics = analyzeScamText(
      'DPD: jūsų siunta sulaikyta. Sumokėkite pristatymo mokestį.', 'sms', false)
    const withoutDiacritics = analyzeScamText(
      'DPD: jusu siunta sulaikyta. Sumokekite pristatymo mokesti.', 'sms', false)
    expect(withoutDiacritics.level).toBe(withDiacritics.level)
    expect(withoutDiacritics.detectedTypes.map(d => d.id))
      .toEqual(withDiacritics.detectedTypes.map(d => d.id))
    expect(withoutDiacritics.detectedTypes.map(d => d.id)).toContain('courier_customs')
  })

  it('sorts detected types by score, strongest first', () => {
    const r = analyzeScamText(
      'Jusu saskaita uzblokuota del itartinos veiklos. Siunta sulaikyta muitineje, sumokekite muito mokesti.',
      'sms', false)
    expect(r.detectedTypes.length).toBeGreaterThanOrEqual(2)
    const scores = r.detectedTypes.map(d => d.score)
    expect(scores).toEqual([...scores].sort((a, b) => b - a))
  })

  it('never reports kritinė from knowledge scoring alone (cap at aukšta)', () => {
    // Strong category hints but none of the hard kritinė rules (no URL, no
    // credentials, no payment+pressure combination from the waterfall).
    const r = analyzeScamText(
      'Garantuota graza, asmeninis brokeris, pradine imoka, kriptovaliutos.', 'other', false)
    expect(r.detectedTypes.map(d => d.id)).toContain('investment_crypto')
    expect(levelIdx(r.level)).toBeLessThanOrEqual(levelIdx('auksta'))
  })
})

// ─── Knowledge base integrity ────────────────────────────────────────────────

describe('knowledge base integrity', () => {
  it('category ids are unique', () => {
    const ids = SCAM_CATEGORIES.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('contains all 13 planned categories', () => {
    expect(SCAM_CATEGORIES).toHaveLength(13)
  })

  it('pattern values are normalized (lowercase, no Lithuanian diacritics)', () => {
    for (const cat of SCAM_CATEGORIES) {
      for (const p of cat.patterns) {
        expect(p.value, `${cat.id}: "${p.value}" must be pre-normalized`).toBe(normalizeLt(p.value))
      }
    }
  })

  it('regex patterns compile', () => {
    for (const cat of SCAM_CATEGORIES) {
      for (const p of cat.patterns) {
        if (p.kind === 'regex') {
          expect(() => new RegExp(p.value, 'i'), `${cat.id}: ${p.value}`).not.toThrow()
        }
      }
    }
  })

  it('every category has required content fields', () => {
    for (const cat of SCAM_CATEGORIES) {
      expect(cat.nameLt.length, cat.id).toBeGreaterThan(0)
      expect(cat.explanationLt.length, cat.id).toBeGreaterThan(0)
      expect(cat.redFlagsLt.length, cat.id).toBeGreaterThan(0)
      expect(cat.patterns.length, cat.id).toBeGreaterThan(0)
      expect(cat.scammerGoalLt.length, cat.id).toBeGreaterThan(0)
      expect(cat.safeActionLt.length, cat.id).toBeGreaterThan(0)
      expect(cat.examplesLt.length, cat.id).toBeGreaterThan(0)
      expect(cat.sources.length, cat.id).toBeGreaterThan(0)
      expect(cat.baseWeight, cat.id).toBeGreaterThan(0)
    }
  })

  it('results never use overclaiming language', () => {
    const r = analyze({ text: 'SEB: patvirtinkite tapatybę su Smart-ID kodu.', category: 'sms' })
    const everything = JSON.stringify(r)
    expect(everything).not.toContain('100%')
    expect(everything).not.toContain('garantuotai sukčiavimas')
    expect(r.disclaimer).toContain('demo vertinimas')
  })
})
