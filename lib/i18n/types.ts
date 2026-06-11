// ─── ScamCheck LT — i18n type definitions (v0.4) ─────────────────────────────
//
// Public-UI multilingual layer. This ONLY covers static interface text
// (labels, titles, buttons, helper copy). Scam-detection behaviour, category
// IDs and risk-level internal values (`zema` / `vidutine` / `auksta` /
// `kritine`) are intentionally NOT touched here — see lib/i18n/translations.ts.

import type {
  MessageCategory,
  Situation,
  RiskLevel,
  QuickAnswer,
} from '@/lib/types'

export type Language = 'lt' | 'en' | 'de' | 'ru'

// Lithuanian is the source of truth and the default.
export const DEFAULT_LANGUAGE: Language = 'lt'

// Order shown in the LT | EN | DE | RU switcher.
export const LANGUAGES: Language[] = ['lt', 'en', 'de', 'ru']

// Short labels rendered in the switcher itself.
export const LANGUAGE_LABELS: Record<Language, string> = {
  lt: 'LT',
  en: 'EN',
  de: 'DE',
  ru: 'RU',
}

// ─── Translation shape ───────────────────────────────────────────────────────
//
// Every language MUST provide every key — TypeScript enforces this through
// `Translations = Record<Language, Translation>` in translations.ts.

export interface Translation {
  // Intl locale used for date formatting on the result page.
  dateLocale: string

  header: {
    back: string
    languageLabel: string // accessible label for the switcher group
  }

  home: {
    eyebrow: string
    heading: string
    subheading: string
    subNote: string
    trustSpeed: string
    trustPrivacy: string
    trustLocal: string
    disclaimer: string
  }

  form: {
    situationLegend: string
    situations: Record<Situation, string>

    privacyReminderLabel: string
    privacyReminderText: string

    textareaLabel: string
    textareaPlaceholder: string
    minChars: string

    categoryLegend: string
    categoryChips: Record<MessageCategory, string>

    urlLabel: string
    urlOptional: string
    urlPlaceholder: string
    urlHelp: string

    submit: string
    footerNote: string

    demoExamplesTitle: string
    demoExamplesHint: string
    demoExamples: Record<string, string> // keyed by DemoExample.id

    errorMinChars: string
    errorTooLong: string
    errorGeneric: string

    loadingSteps: string[]
    loadingScanning: string
    loadingWait: string
  }

  result: {
    // Empty / deleted states
    notFound: string
    notFoundLink: string
    deleted: string
    deletedLink: string

    // Risk badge
    categoryNames: Record<MessageCategory, string>
    riskLabels: Record<RiskLevel, string>
    demoVerdictLabel: string

    // Sections
    doNowHeading: string
    quickAnswersTitle: string
    quickQuestions: {
      clickLink: string
      pay: string
      reply: string
      humanReview: string
    }
    quickAnswerLabels: Record<QuickAnswer, string>

    redFlagsTitle: string
    whySuspiciousTitle: string

    detectedTitleSingle: string
    detectedTitleMultiple: string
    detectedIntro: string
    detectedGoal: string
    detectedSafeAction: string
    detectedSources: string
    strengthLabels: { galimas: string; tiketinas: string }

    doNotDoTitle: string
    verifyTitle: string
    replyTitleCritical: string
    safeReplyTitle: string
    copyReply: string
    copied: string
    nextStepsTitle: string

    // URL technical section
    urlSectionTitle: string
    urlShortened: string
    urlImpersonation: string
    urlYes: string
    urlNo: string
    urlDetected: string
    urlNotFound: string
    urlTldLabel: string
    urlNotesLabel: string
    urlVerdicts: Record<'suspicious' | 'unknown' | 'no_flags_found', string>

    // Human review
    humanReviewTitle: string
    humanReviewCta: string

    disclaimerChip1: string
    checkAnother: string
    deleteTitle: string
  }

  humanReview: {
    formTitle: string
    closeAria: string
    protoWarning: string
    caseLine: string // contains {caseId}
    emailLabel: string
    optional: string
    emailPlaceholder: string
    notesLabel: string
    notesPlaceholder: string
    urgencyLabel: string
    normalLabel: string
    normalSub: string
    urgentLabel: string
    urgentSub: string
    submit: string

    submittedProtoNote: string
    submittedTitle: string
    submittedBody: string // contains {caseId}
  }
}

export type Translations = Record<Language, Translation>
