'use client'

// ─── ScamCheck LT — Language context provider (v0.4) ─────────────────────────
//
// Holds the currently selected public-UI language and persists it to
// localStorage. Hydration-safe: the server render and the first client render
// both use DEFAULT_LANGUAGE (Lithuanian), so markup matches. The stored
// preference is applied in an effect AFTER mount, which can only ever upgrade
// the client to the saved language without a hydration mismatch.

import { createContext, useEffect, useState, type ReactNode } from 'react'
import { DEFAULT_LANGUAGE, LANGUAGES, type Language } from './types'

const STORAGE_KEY = 'scamcheck_lang'

export interface LanguageContextValue {
  lang: Language
  setLang: (lang: Language) => void
}

export const LanguageContext = createContext<LanguageContextValue>({
  lang: DEFAULT_LANGUAGE,
  setLang: () => {},
})

function isLanguage(value: string | null): value is Language {
  return value !== null && (LANGUAGES as string[]).includes(value)
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(DEFAULT_LANGUAGE)

  // Restore the saved language once, after mount (avoids hydration mismatch).
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (isLanguage(stored)) setLangState(stored)
    } catch {
      // localStorage may be unavailable (private mode, blocked) — ignore.
    }
  }, [])

  // Keep <html lang> in sync with the active language for accessibility.
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  function setLang(next: Language) {
    setLangState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Persisting is best-effort; the in-memory switch still works.
    }
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  )
}
