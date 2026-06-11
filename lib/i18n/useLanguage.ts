'use client'

// ─── ScamCheck LT — useLanguage hook (v0.4) ──────────────────────────────────
//
// Convenience hook for public-UI components. Returns the active language, a
// setter, and `t` — the full translation dictionary for the current language.
// Usage:  const { t, lang, setLang } = useLanguage()  →  t.home.heading

import { useContext } from 'react'
import { LanguageContext } from './LanguageProvider'
import { translations } from './translations'
import type { Language, Translation } from './types'

export function useLanguage(): {
  lang: Language
  setLang: (lang: Language) => void
  t: Translation
} {
  const { lang, setLang } = useContext(LanguageContext)
  return { lang, setLang, t: translations[lang] }
}
