'use client'

// ─── ScamCheck LT — public language switcher (v0.4) ──────────────────────────
//
// Compact LT | EN | DE | RU toggle for the dark header bar. Switching updates
// the UI immediately (in-page, no reload) and the choice is persisted by
// LanguageProvider. Mobile-first: small tap targets that still fit on a phone.

import { LANGUAGES, LANGUAGE_LABELS } from '@/lib/i18n/types'
import { useLanguage } from '@/lib/i18n/useLanguage'

export default function LanguageSwitcher() {
  const { lang, setLang, t } = useLanguage()

  return (
    <div
      role="group"
      aria-label={t.header.languageLabel}
      className="flex items-center rounded-full bg-white/10 p-0.5"
    >
      {LANGUAGES.map((code) => {
        const active = code === lang
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            aria-pressed={active}
            aria-label={LANGUAGE_LABELS[code]}
            className={`px-2 py-1 rounded-full text-[11px] font-bold tracking-wide leading-none transition-colors ${
              active
                ? 'bg-white text-ink-900'
                : 'text-blue-200 hover:text-white'
            }`}
          >
            {LANGUAGE_LABELS[code]}
          </button>
        )
      })}
    </div>
  )
}
