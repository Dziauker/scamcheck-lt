// ─── ScamCheck LT v0.2 — scam detection engine ───────────────────────────────
//
// Combines two layers; the final level is the MAX of both, so adding knowledge
// can only keep risk the same or make it stricter — never weaker:
//
//   1. RULE WATERFALL — the v0.1 logic from mockAnalysis.detectBaseRisk(),
//      now reading its keyword groups from knowledge/riskSignals.ts.
//      All hard KRITINĖ rules live here.
//   2. KNOWLEDGE SCORING — matches knowledge/scamPatterns.ts categories and
//      maps the top score to a level. Scoring is deliberately CAPPED AT
//      AUKŠTA: kritinė can only come from hard rules (credentials, already
//      acted, URL+payment, brand impersonation, severe situations), so a pile
//      of weak hints can never produce a false "critical".
//
// All matching runs on normalized text (lowercase, no Lithuanian diacritics).

import { RiskLevel, MessageCategory, DetectedScamType } from './types'
import { normalizeLt } from './textNormalize'
import { SCAM_CATEGORIES, SOURCE_LABELS_LT, TextPattern } from '@/knowledge/scamPatterns'
import { RISK_SIGNALS, RiskSignalId, getRiskSignal } from '@/knowledge/riskSignals'

// ─── Risk level helpers ──────────────────────────────────────────────────────

export const RISK_LEVEL_ORDER: RiskLevel[] = ['zema', 'vidutine', 'auksta', 'kritine']

export const maxLevel = (a: RiskLevel, b: RiskLevel): RiskLevel =>
  RISK_LEVEL_ORDER.indexOf(a) >= RISK_LEVEL_ORDER.indexOf(b) ? a : b

// ─── Tuning constants ────────────────────────────────────────────────────────

// Sum of matched pattern weights needed before a category counts as detected.
const CATEGORY_MATCH_THRESHOLD = 5
// Matched pattern weight sum at which a detection is labeled 'tiketinas' (vs 'galimas').
const STRONG_MATCH_PATTERN_SCORE = 9
// Total score (baseWeight + pattern sum) at which knowledge scoring yields AUKŠTA.
const KB_HIGH_RISK_TOTAL = 13

// ─── Pattern matching ────────────────────────────────────────────────────────

const regexCache = new Map<string, RegExp>()

function getRegex(value: string): RegExp {
  let re = regexCache.get(value)
  if (!re) {
    re = new RegExp(value, 'i')
    regexCache.set(value, re)
  }
  return re
}

// `text` must already be normalized (normalizeLt).
function patternMatches(text: string, p: TextPattern): boolean {
  return p.kind === 'phrase' ? text.includes(p.value) : getRegex(p.value).test(text)
}

// ─── Risk signals ────────────────────────────────────────────────────────────

function matchSignalIds(text: string): Set<RiskSignalId> {
  const hits = new Set<RiskSignalId>()
  for (const signal of RISK_SIGNALS) {
    if (signal.patterns.some(p => patternMatches(text, p))) hits.add(signal.id)
  }
  return hits
}

// Convenience for callers holding raw (non-normalized) text.
export function textHasSignal(rawText: string, id: RiskSignalId): boolean {
  const text = normalizeLt(rawText)
  return getRiskSignal(id).patterns.some(p => patternMatches(text, p))
}

// ─── Amount extraction ───────────────────────────────────────────────────────

// Extracts an amount in EUR if present (handles "400€", "€ 200", "200 eur").
// Expects normalized text ("euru", not "eurų").
export function extractAmountEur(text: string): number {
  const m = text.match(/(\d{1,5})\s*(?:€|eur\b|eurai|euru|euro)/i)
            ?? text.match(/€\s*(\d{1,5})/i)
  return m ? parseInt(m[1], 10) : 0
}

// ─── Layer 1: rule waterfall (v0.1 detectBaseRisk, behavior-preserving) ──────

const RENT_CONTEXT_RE = /\b(butas|buta|nuom\w*|savinink\w*)\b/
const ABROAD_RE = /uzsieny|uzsieni|abroad/

function waterfallLevel(
  text: string,
  category: MessageCategory,
  hasUrl: boolean,
  hit: Set<RiskSignalId>,
): RiskLevel {
  // ── KRITINĖ ────────────────────────────────────────────────────────────────
  if (hit.has('critical_credentials')) return 'kritine'
  if (hit.has('already_acted')) return 'kritine'

  // Any URL + payment / confirmation language → kritinė
  if (hasUrl && (hit.has('payment') || hit.has('confirmation'))) return 'kritine'

  // Courier / post / bank impersonation in text + URL + (payment OR address update) → kritinė
  const claimsBrand = hit.has('brand_mention')
  if (claimsBrand && hasUrl && (hit.has('payment') || hit.has('address_update'))) {
    return 'kritine'
  }

  // Rental scam: rent + deposit + (abroad OR large amount) → kritinė
  const rentContext = RENT_CONTEXT_RE.test(text)
  const depositCtx = hit.has('deposit')
  const abroad = ABROAD_RE.test(text)
  const largeAmount = extractAmountEur(text) >= 200
  if (rentContext && depositCtx && (abroad || largeAmount)) return 'kritine'

  // ── AUKŠTA ─────────────────────────────────────────────────────────────────
  const offPlatform = hit.has('off_platform')
  const thirdParty = hit.has('third_party_money')
  const hasPayment = hit.has('payment')
  const hasDelivery = hit.has('delivery')
  const hasPressure = hit.has('pressure')

  if ((offPlatform || thirdParty) &&
      (hasPayment || hasDelivery || depositCtx || hasPressure || hasUrl)) {
    return 'auksta'
  }
  if (hasPressure && hasPayment) return 'auksta'
  if (claimsBrand && hasUrl) return 'auksta'
  if (hit.has('high_risk_phrase')) return 'auksta'
  if (category === 'sms' && hasPayment) return 'auksta'

  // ── VIDUTINĖ ───────────────────────────────────────────────────────────────
  if ((category === 'vinted' || category === 'facebook_marketplace') && offPlatform) {
    return 'vidutine'
  }
  if (offPlatform || thirdParty) return 'vidutine'
  if (category === 'payment_request') return 'vidutine'
  if (hasPressure) return 'vidutine'

  return 'zema'
}

// ─── Layer 2: knowledge-base category scoring ────────────────────────────────

function matchScamCategories(text: string): DetectedScamType[] {
  const detected: DetectedScamType[] = []

  for (const cat of SCAM_CATEGORIES) {
    const matched = cat.patterns.filter(p => patternMatches(text, p))
    const patternScore = matched.reduce((sum, p) => sum + p.weight, 0)
    if (patternScore < CATEGORY_MATCH_THRESHOLD) continue

    const notes = matched.map(p => p.noteLt).filter((n): n is string => !!n)
    detected.push({
      id: cat.id,
      name_lt: cat.nameLt,
      explanation_lt: cat.explanationLt,
      scammer_goal_lt: cat.scammerGoalLt,
      safe_action_lt: cat.safeActionLt,
      matched_red_flags_lt: Array.from(new Set(notes)),
      match_strength: patternScore >= STRONG_MATCH_PATTERN_SCORE ? 'tiketinas' : 'galimas',
      score: cat.baseWeight + patternScore,
      source_labels_lt: cat.sources.map(s => SOURCE_LABELS_LT[s]),
    })
  }

  return detected.sort((a, b) => b.score - a.score)
}

// Knowledge scoring is capped at AUKŠTA by design (see file header).
function knowledgeLevel(detected: DetectedScamType[]): RiskLevel {
  if (detected.length === 0) return 'zema'
  return detected[0].score >= KB_HIGH_RISK_TOTAL ? 'auksta' : 'vidutine'
}

// ─── Main export ─────────────────────────────────────────────────────────────

export interface ScamEngineResult {
  // Text-based risk level (before situation overlay and URL-verdict escalation,
  // which mockAnalysis applies on top).
  level: RiskLevel
  detectedTypes: DetectedScamType[]
  matchedSignalIds: RiskSignalId[]
  // Top detected category total score (0 when nothing detected).
  score: number
}

export function analyzeScamText(
  rawText: string,
  category: MessageCategory,
  hasUrl: boolean,
): ScamEngineResult {
  const text = normalizeLt(rawText)

  const signalIds = matchSignalIds(text)
  const detectedTypes = matchScamCategories(text)

  const base = waterfallLevel(text, category, hasUrl, signalIds)
  const kb = knowledgeLevel(detectedTypes)

  return {
    level: maxLevel(base, kb),
    detectedTypes,
    matchedSignalIds: Array.from(signalIds),
    score: detectedTypes[0]?.score ?? 0,
  }
}
