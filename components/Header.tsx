'use client'

import Link from 'next/link'

interface HeaderProps {
  showBack?: boolean  // FIX H4: show back link on result page
}

export default function Header({ showBack = false }: HeaderProps) {
  return (
    <header className="bg-ink-900 text-white px-4 py-3.5 sticky top-0 z-50 shadow-sm">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <ShieldLogo />
          <span className="font-bold text-base tracking-tight leading-none">ScamCheck LT</span>
          <span className="hidden sm:inline text-[10px] font-mono text-blue-300 bg-blue-900/60 px-1.5 py-0.5 rounded uppercase tracking-wider">
            PROTOTIPAS
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {/* FIX H4: back button on result page so user doesn't need to scroll */}
          {showBack && (
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-blue-200 hover:text-white transition-colors font-medium"
            >
              <ArrowLeftIcon />
              Tikrinti kitą
            </Link>
          )}
          {!showBack && (
            <span className="text-[10px] font-mono text-blue-300 uppercase tracking-wider sm:hidden">
              v0.1
            </span>
          )}
        </div>
      </div>
    </header>
  )
}

function ShieldLogo() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
      <path
        d="M13 1.5L3.5 5.5v7c0 5.2 4 10.1 9.5 11.5C18.5 22.6 22.5 17.7 22.5 12.5v-7L13 1.5z"
        fill="#2563eb"
      />
      <path
        d="M9.5 13l2.8 2.8 4.7-5.6"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ArrowLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M8.5 3L4.5 7l4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
