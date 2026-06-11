// ─── ScamCheck LT v0.3 — Admin Panel Lite layout ─────────────────────────────
//
// Internal chrome shared by /admin and /admin/login. Deliberately styled as an
// internal control panel (dark utilitarian top bar, slate background, mono
// accents) so it never reads like public user-facing content.

import type { Metadata } from 'next'
import Link from 'next/link'
import { isAdminAuthenticated } from '@/lib/adminAuth'
import { ADMIN_PANEL_VERSION } from '@/constants/appMeta'
import { logoutAction } from './actions'

export const metadata: Metadata = {
  title: 'ScamCheck LT — Admin',
  robots: 'noindex, nofollow',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const authed = isAdminAuthenticated()

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-slate-900 text-slate-100 border-b-2 border-brand">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="font-bold text-sm tracking-tight">ScamCheck LT</span>
            <span className="text-[10px] font-mono bg-slate-700 text-slate-200 px-1.5 py-0.5 rounded uppercase tracking-wider">
              Admin
            </span>
            <span className="hidden sm:inline text-[10px] font-mono text-amber-300 bg-amber-900/40 px-1.5 py-0.5 rounded uppercase tracking-wider">
              Tik peržiūra
            </span>
          </div>

          {authed && (
            <form action={logoutAction} className="flex-shrink-0">
              <button
                type="submit"
                className="text-xs font-semibold text-slate-300 hover:text-white border border-slate-600 hover:border-slate-400 rounded-lg px-3 py-1.5 transition-colors"
              >
                Atsijungti
              </button>
            </form>
          )}
        </div>

        {authed && (
          <nav className="bg-slate-800/60 border-t border-slate-700">
            <div className="max-w-3xl mx-auto px-4 flex items-center gap-1">
              <Link
                href="/admin"
                className="text-xs font-semibold text-slate-300 hover:text-white py-2.5 px-3 border-b-2 border-transparent hover:border-slate-500 transition-colors"
              >
                Apžvalga
              </Link>
              <Link
                href="/admin/trends"
                className="text-xs font-semibold text-slate-300 hover:text-white py-2.5 px-3 border-b-2 border-transparent hover:border-slate-500 transition-colors"
              >
                Admin trendai
              </Link>
            </div>
          </nav>
        )}
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">{children}</main>

      <footer className="max-w-3xl mx-auto px-4 pb-8 pt-2">
        <p className="text-[11px] text-slate-400 font-mono">
          ScamCheck LT · vidinė panelė · {ADMIN_PANEL_VERSION}
        </p>
      </footer>
    </div>
  )
}
