export type RiskLevel = 'zema' | 'vidutine' | 'auksta' | 'kritine'

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
  disclaimer: string
}

export interface SubmissionInput {
  text: string
  category: MessageCategory
  situation?: Situation
  url?: string
}
