// ─── ScamCheck LT v0.3 — Admin Panel Lite login ──────────────────────────────
//
// Server-rendered login screen. The form posts to the loginAction server
// action, which verifies the password against ADMIN_PASSWORD and sets an
// httpOnly cookie. Errors are surfaced via the ?error= query param.

import { redirect } from 'next/navigation'
import { isAdminAuthenticated, adminPasswordConfigured } from '@/lib/adminAuth'
import { loginAction } from '../actions'

export const dynamic = 'force-dynamic'

const ERROR_MESSAGES: Record<string, string> = {
  invalid: 'Neteisingas slaptažodis. Bandykite dar kartą.',
  config: 'ADMIN_PASSWORD nenustatytas serveryje. Kreipkitės į administratorių.',
}

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  // Already signed in → straight to the dashboard.
  if (isAdminAuthenticated()) {
    redirect('/admin')
  }

  const configured = adminPasswordConfigured()
  const error = searchParams.error ? ERROR_MESSAGES[searchParams.error] : undefined

  return (
    <div className="max-w-sm mx-auto pt-6">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <div className="mb-5">
          <p className="text-[11px] font-mono uppercase tracking-widest text-slate-400 mb-1">
            Vidinė panelė
          </p>
          <h1 className="text-xl font-black text-slate-900">Administratoriaus prisijungimas</h1>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
            Ši sritis skirta tik ScamCheck LT žinių bazės peržiūrai.
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {!configured && !error && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
            <p className="text-xs text-amber-800 leading-relaxed">
              ⚠️ <strong>ADMIN_PASSWORD</strong> dar nenustatytas. Prisijungimas neveiks,
              kol aplinkos kintamasis nebus pridėtas.
            </p>
          </div>
        )}

        <form action={loginAction} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-slate-600 mb-1.5"
            >
              Slaptažodis
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:border-brand transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-sm transition-colors"
          >
            Prisijungti
          </button>
        </form>
      </div>

      <p className="text-center text-[11px] text-slate-400 mt-4 leading-relaxed">
        ScamCheck LT vidinė valdymo panelė · tik peržiūra
      </p>
    </div>
  )
}
