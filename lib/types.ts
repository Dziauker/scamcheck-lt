export type RiskLevel = 'zema' | 'vidutine' | 'auksta' | 'kritine'

// v0.2 — structured scam knowledge base category ids (see knowledge/scamPatterns.ts)
export type ScamCategoryId =
  | 'courier_customs'
  | 'bank_account_block'
  | 'marketplace_fake_payment'
  | 'rental_deposit'
  | 'investment_crypto'
  | 'fake_job'
  | 'romance'
  | 'family_emergency'
  | 'gov_impersonation'
  | 'utility_fine'
  | 'voice_deepfake'
  | 'invoice_bec'
  | 'shortlink_domain'

// v0.2 — a scam scheme the engine recognized in the text.
// match_strength wording is deliberately uncertain ("galimas" / "tikėtinas"):
// the demo never claims certainty.
export interface DetectedScamType {
  id: ScamCategoryId
  name_lt: string
  explanation_lt: string
  scammer_goal_lt: string
  safe_action_lt: string
  matched_red_flags_lt: string[]
  match_strength: 'galimas' | 'tiketinas'
  score: number
  source_labels_lt: string[]
}

export type MessageCategory =
  | 'vinted'
  | 'facebook_marketplace'
  | 'sms'
  | 'email'
  | 'classified_ad'
  | 'payment_request'
  | 'other'

// "Kas jau įvyko?" — user-reported situation. Severe selections force kritinė.
export type Situation =
  | 'none'               // Dar nieko nedariau
  | 'clicked_link'       // Jau paspaudžiau nuorodą
  | 'entered_card'       // Jau įvedžiau kortelės duomenis
  | 'confirmed_smartid'  // Jau patvirtinau Smart-ID / Mobile-ID
  | 'sent_money'         // Jau pervedžiau pinigus

// FIX H1: Explicit quick-answer answers per user question
export type QuickAnswer = 'ne' | 'atsargiai' | 'taip' | 'nezinoma'

export interface QuickAnswers {
  clickLink:    QuickAnswer  // Ar spausti nuorodą?
  pay:          QuickAnswer  // Ar mokėti?
  reply:        QuickAnswer  // Ar atrašyti?
  humanReview:  QuickAnswer  // Ar reikia žmogaus peržiūros?
}

export interface UrlAnalysisResult {
  url_provided: string
  domain_extracted: string
  tld_flags: string[]
  brand_impersonation_detected: boolean
  shortener_detected: boolean
  pattern_notes: string[]
  // FIX C2: changed from 'likely_safe' to 'no_flags_found' to avoid overclaiming
  verdict: 'suspicious' | 'unknown' | 'no_flags_found'
  warning: string
}

export interface HumanReview {
  recommended: boolean
  reason: string
}

export interface AnalysisResult {
  case_id: string
  analyzed_at: string
  category: MessageCategory
  situation: Situation
  analysis_type: 'ai_preliminary'

  risk_level: RiskLevel
  quick_answers: QuickAnswers
  short_verdict: string
  do_now: string[]              // Top action block under the risk badge
  red_flags: string[]
  why_suspicious: string[]
  do_not_do: string[]
  verify_before_acting: string[]
  safe_reply: string
  next_steps: string[]
  human_review: HumanReview
  url_analysis?: UrlAnalysisResult
  // v0.2 — scam schemes recognized by the knowledge base (sorted by score desc).
  // Optional so results stored before v0.2 still parse.
  detected_scam_types?: DetectedScamType[]
  disclaimer: string
}

export interface SubmissionInput {
  text: string
  category: MessageCategory
  situation?: Situation
  url?: string
}
