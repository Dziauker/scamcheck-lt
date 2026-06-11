'use client'

import Header from '@/components/Header'
import SubmissionForm from '@/components/SubmissionForm'
import { useLanguage } from '@/lib/i18n/useLanguage'

export default function HomePage() {
  const { t } = useLanguage()

  // Trust signals: emoji stays fixed, label comes from translations.
  const trustSignals = [
    { icon: '⚡', label: t.home.trustSpeed },
    { icon: '🔒', label: t.home.trustPrivacy },
    { icon: '🇱🇹', label: t.home.trustLocal },
  ]

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <main className="max-w-2xl mx-auto px-4 pt-8 pb-12">

        {/* Hero */}
        <div className="text-center mb-7">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-3">
            {t.home.eyebrow}
          </p>
          <h1 className="text-[1.75rem] font-black text-ink-900 leading-tight mb-3">
            {t.home.heading}
          </h1>
          <p className="text-gray-700 text-base leading-relaxed max-w-md mx-auto">
            {t.home.subheading}
          </p>
          <p className="text-gray-500 text-xs leading-relaxed max-w-md mx-auto mt-2.5">
            {t.home.subNote}
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 px-5 py-6 sm:px-6">
          <SubmissionForm />
        </div>

        {/* Trust signals */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2">
          {trustSignals.map(({ icon, label }) => (
            <div
              key={label}
              className="bg-white border border-gray-200 rounded-xl px-3 py-3 flex sm:flex-col items-center sm:text-center gap-2 sm:gap-1"
            >
              <span className="text-xl" aria-hidden="true">{icon}</span>
              <p className="text-xs text-gray-500 font-medium leading-tight">{label}</p>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-gray-400 mt-6 leading-relaxed px-2">
          {t.home.disclaimer}
        </p>
      </main>
    </div>
  )
}
