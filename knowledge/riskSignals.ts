// ─── ScamCheck LT v0.2 — cross-category risk signals ─────────────────────────
//
// These are the v0.1 keyword groups from lib/mockAnalysis.ts, extracted as
// data. The engine's rule waterfall (lib/scamEngine.ts) combines them exactly
// like v0.1 did, so existing behavior is preserved.
//
// Pattern values are matched against NORMALIZED text (lowercase, Lithuanian
// diacritics stripped) — write "sumokekite", not "sumokėkite".
//
// `critical: true` signals force KRITINĖ risk on their own — they may never
// be downgraded by scoring.

import { TextPattern } from './scamPatterns'

export type RiskSignalId =
  | 'critical_credentials'
  | 'already_acted'
  | 'off_platform'
  | 'third_party_money'
  | 'payment'
  | 'delivery'
  | 'deposit'
  | 'pressure'
  | 'confirmation'
  | 'address_update'
  | 'brand_mention'
  | 'high_risk_phrase'

export interface RiskSignal {
  id: RiskSignalId
  nameLt: string
  weight: number
  critical?: boolean
  patterns: TextPattern[]
}

const phrases = (values: string[]): TextPattern[] =>
  values.map(value => ({ kind: 'phrase' as const, value }))

export const RISK_SIGNALS: RiskSignal[] = [
  {
    // v0.1 CRITICAL_PHRASES — sensitive credentials or explicit confirmation-link phrasing.
    id: 'critical_credentials',
    nameLt: 'Prašomi jautrūs duomenys ar patvirtinimas',
    weight: 10,
    critical: true,
    patterns: phrases([
      // Second factors / IDs
      'smart-id', 'smartid', 'mobile-id', 'mobileid',
      // Card data
      'cvv', 'cvc kodas', 'cvc kods',
      'korteles numer', 'korteles nr', 'korteles duomen',
      // Bank credentials
      'prisijungimo duomen',
      'iveskite slaptazodi', 'banko slaptaz', 'banko prisijungim', 'banko kod',
      'slaptazod',
      // Personal code
      'asmens kodas', 'asmens nr.',
      // Confirmation codes / actions
      'patvirtinkite koda', 'patvirtink koda', 'iveskite koda',
      'patvirtinkite pavedima', 'patvirtink pavedima',
      'patvirtinkite per nuoroda', 'patvirtink per nuoroda',
      'patvirtinkite mokejima', 'patvirtinkite gavima',
      'gavote mokejima', 'mokejimas atliktas',
    ]),
  },
  {
    // v0.1 ALREADY_ACTED — user indicates they already acted.
    id: 'already_acted',
    nameLt: 'Vartotojas jau atliko veiksmą',
    weight: 10,
    critical: true,
    patterns: phrases([
      'jau paspaudziau', 'jau ivedziau', 'jau patvirtinau',
      'jau pervedziau', 'jau apmokejau', 'jau sumokejau',
    ]),
  },
  {
    id: 'off_platform',
    nameLt: 'Siūloma pereiti į kitą platformą',
    weight: 3,
    patterns: phrases(['whatsapp', 'telegram', 'viber']),
  },
  {
    id: 'third_party_money',
    nameLt: 'Trečiosios šalies mokėjimo sistema',
    weight: 3,
    patterns: phrases(['revolut', 'paypal', 'western union', 'moneygram']),
  },
  {
    // v0.1 had 'pervesk'; 'perves' additionally covers "pervesti", "pervedimas" —
    // broader match means same-or-stricter risk, never weaker.
    id: 'payment',
    nameLt: 'Mokėjimo kontekstas',
    weight: 2,
    patterns: phrases(['moke', 'perves', 'sumok', 'apmoke', 'saskait', 'pavedim']),
  },
  {
    id: 'delivery',
    nameLt: 'Siuntos / pristatymo kontekstas',
    weight: 2,
    patterns: phrases(['siunt', 'pristat', 'kurjer', 'muitin']),
  },
  {
    id: 'deposit',
    nameLt: 'Depozito / avanso kontekstas',
    weight: 3,
    patterns: phrases(['depozit', 'avans', 'uzstat', 'rezervacij']),
  },
  {
    id: 'pressure',
    nameLt: 'Skubinimas ir spaudimas',
    weight: 3,
    patterns: phrases([
      'skubiai', 'nedelsiant', 'nedelsdami', 'tuoj',
      'per valanda', 'per 24 val', 'per 2 val', 'siandien dar', 'kuo greiciau',
      'paskutine galimybe', 'bus grazinta', 'bus uzblokuota', 'kitaip bus',
    ]),
  },
  {
    id: 'confirmation',
    nameLt: 'Prašoma patvirtinti',
    weight: 2,
    patterns: phrases(['patvirtin', 'confirm', 'verify', 'verifik']),
  },
  {
    id: 'address_update',
    nameLt: 'Prašoma atnaujinti adresą',
    weight: 3,
    patterns: phrases([
      'atnaujinkite adres', 'atnaujinti adres', 'patikslinkite adres', 'pakeisti adres',
    ]),
  },
  {
    // Brands a scam SMS might claim to be from (text-side, not URL-side).
    id: 'brand_mention',
    nameLt: 'Minimas kurjerio / banko prekės ženklas',
    weight: 2,
    patterns: phrases([
      'dpd', 'omniva', 'dhl', 'lp express', 'lpexpress', 'lietuvos pastas',
      'seb', 'swedbank', 'luminor', 'paysera', 'revolut', 'siauliu bankas', 'muitin',
    ]),
  },
  {
    // v0.1 HIGH_PATTERNS — standalone aukšta patterns (no context required).
    id: 'high_risk_phrase',
    nameLt: 'Žinoma sukčiavimo frazė',
    weight: 4,
    patterns: phrases([
      'bit.ly', 'tinyurl', 'cutt.ly', 'rb.gy',
      'draudimo mokestis', 'siuntimo draudimas', 'insurance fee', 'apsauga mokestis',
      'depozitas', 'avansas', 'rezervacinis mokestis', 'uzstatas',
      'muito mokestis', 'sulaikyta siunta', 'muitine: ', 'muitines pranesimas',
      'saskaita sustabdyta', 'paskyra sustabdyta', 'laikinai blokuota', 'laikinai sustabdyta',
      'reikia sumoketi', 'sumokekite mokesti', 'sumokekite papildoma',
      'kurjeri atsiusiu', 'atsiimsiu kurjerias',
      'ne per platforma', 'ne per vinted', 'ne per facebook',
    ]),
  },
]

export function getRiskSignal(id: RiskSignalId): RiskSignal {
  const signal = RISK_SIGNALS.find(s => s.id === id)
  if (!signal) throw new Error(`Unknown risk signal: ${id}`)
  return signal
}
