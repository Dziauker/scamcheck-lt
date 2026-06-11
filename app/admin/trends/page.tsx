// ─── ScamCheck LT v0.5 — Admin Trend Manager ─────────────────────────────────
//
// Lists admin-managed scam trends from Supabase and lets an admin create new
// DRAFT trends. This is the foundation step:
//   * Draft trends do NOT affect public detection.
//   * Even 'active' DB trends do NOT affect the engine yet — wiring is a later,
//     explicitly-approved step.
//   * When Supabase is not configured, the page shows a calm "not configured"
//     state instead of erroring.
//
// The static knowledge base (knowledge/scamPatterns.ts) remains the trusted
// baseline and is unaffected by anything here.

import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/adminAuth'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { listTrends } from '@/lib/supabase/trendsRepo'
import { RISK_LEVELS, TrendStatus, ScamTrendRow } from '@/lib/supabase/types'
import { RiskLevel } from '@/lib/types'
import { createTrendDraftAction } from './actions'

export const dynamic = 'force-dynamic'

// ─── Badge config ─────────────────────────────────────────────────────────────

const RISK_BADGE: Record<RiskLevel, { label: string; bg: string; text: string; border: string }> = {
  zema:     { label: 'ŽEMA',     bg: 'bg-risk-low-bg',  text: 'text-risk-low-text',  border: 'border-risk-low-border' },
  vidutine: { label: 'VIDUTINĖ', bg: 'bg-risk-mid-bg',  text: 'text-risk-mid-text',  border: 'border-risk-mid-border' },
  auksta:   { label: 'AUKŠTA',   bg: 'bg-risk-high-bg', text: 'text-risk-high-text', border: 'border-risk-high-border' },
  kritine:  { label: 'KRITINĖ',  bg: 'bg-risk-crit-bg', text: 'text-risk-crit-text', border: 'border-risk-crit-border' },
}

const STATUS_BADGE: Record<TrendStatus, { label: string; className: string }> = {
  draft:    { label: 'Draft',    className: 'bg-amber-100 text-amber-800 border-amber-200' },
  active:   { label: 'Active',   className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  disabled: { label: 'Disabled', className: 'bg-slate-200 text-slate-500 border-slate-300' },
}

const ERROR_MESSAGES: Record<string, string> = {
  not_configured: 'Supabase nesukonfigūruotas — trendų išsaugoti negalima.',
  validation: 'Patikrinkite formos laukus.',
  save: 'Nepavyko išsaugoti trendo.',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminTrendsPage({
  searchParams,
}: {
  searchParams: { created?: string; error?: string; msg?: string }
}) {
  if (!isAdminAuthenticated()) {
    redirect('/admin/login')
  }

  const configured = isSupabaseConfigured()
  const list = configured ? await listTrends() : null

  const created = searchParams.created === '1'
  const errorBase = searchParams.error ? ERROR_MESSAGES[searchParams.error] : undefined
  const errorDetail = searchParams.msg
  const errorText = errorBase
    ? errorDetail
      ? `${errorBase} ${errorDetail}`
      : errorBase
    : undefined

  return (
    <div className="space-y-6">

      {/* ── Title ── */}
      <div>
        <p className="text-[11px] font-mono uppercase tracking-widest text-slate-400 mb-1">
          Redaguojami scam trendai
        </p>
        <h1 className="text-2xl font-black text-slate-900">Admin trendai</h1>
      </div>

      {/* ── Required safety labels ── */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <p className="text-sm font-bold text-amber-900 mb-1.5 flex items-center gap-2">
          <span aria-hidden="true">🧪</span> Saugos būsena
        </p>
        <ul className="text-xs text-amber-800 space-y-1 leading-relaxed">
          <li>• <strong>Draft trendai dar neveikia viešoje analizėje.</strong></li>
          <li>• Aktyvavimas į engine bus pridėtas vėlesniame etape.</li>
          <li>• Statinė žinių bazė (<code className="font-mono">knowledge/scamPatterns.ts</code>) lieka pagrindinis šaltinis.</li>
        </ul>
      </div>

      {/* ── Flash messages ── */}
      {created && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5">
          <p className="text-sm text-emerald-800 font-medium">
            ✓ Naujas <strong>draft</strong> trendas sukurtas. Jis dar neveikia viešoje analizėje.
          </p>
        </div>
      )}
      {errorText && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
          <p className="text-sm text-red-700 font-medium">{errorText}</p>
        </div>
      )}

      {/* ── Body: configured vs not ── */}
      {!configured ? (
        <NotConfiguredNotice />
      ) : (
        <>
          <TrendList list={list} />
          <NewTrendForm />
        </>
      )}
    </div>
  )
}

// ─── Not-configured state ─────────────────────────────────────────────────────

function NotConfiguredNotice() {
  return (
    <section className="bg-white border border-slate-200 rounded-xl p-5">
      <h2 className="text-sm font-bold text-slate-800 mb-2 uppercase tracking-wide">
        Supabase nesukonfigūruotas
      </h2>
      <p className="text-sm text-slate-600 leading-relaxed mb-3">
        Trendų valdymas reikalauja Supabase. Funkcija neaktyvi, kol nenustatyti serverio aplinkos
        kintamieji. Vieša scam analizė tuo tarpu veikia įprastai ir nuo to nepriklauso.
      </p>
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
          Reikalingi serverio kintamieji
        </p>
        <ul className="text-xs font-mono text-slate-700 space-y-1">
          <li>SUPABASE_URL</li>
          <li>SUPABASE_SERVICE_ROLE_KEY <span className="font-sans text-slate-400">— slaptas, tik serveryje, niekada NEXT_PUBLIC_</span></li>
        </ul>
      </div>
      <p className="text-xs text-slate-500 leading-relaxed mt-3">
        Schema: <code className="font-mono">supabase/migrations/0001_init_trend_manager.sql</code>.
        Sąranka: <code className="font-mono">supabase/README.md</code>.
      </p>
    </section>
  )
}

// ─── Trend list ───────────────────────────────────────────────────────────────

function TrendList({ list }: { list: Awaited<ReturnType<typeof listTrends>> | null }) {
  if (!list) return null

  if (!list.ok) {
    return (
      <section className="bg-red-50 border border-red-200 rounded-xl p-4">
        <h2 className="text-sm font-bold text-red-800 mb-1 uppercase tracking-wide">Klaida skaitant trendus</h2>
        <p className="text-sm text-red-700 leading-relaxed">{list.error}</p>
      </section>
    )
  }

  const trends = list.trends

  return (
    <section>
      <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2 uppercase tracking-wide">
        Trendai (DB)
        <span className="text-[11px] font-mono font-semibold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
          {trends.length}
        </span>
      </h2>

      {trends.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-6 text-center">
          <p className="text-sm font-semibold text-slate-600">Kol kas nėra nė vieno trendo.</p>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Sukurkite pirmą <strong>draft</strong> trendą žemiau esančioje formoje.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {trends.map(t => (
            <TrendCard key={t.id} trend={t} />
          ))}
        </div>
      )}
    </section>
  )
}

function TrendCard({ trend }: { trend: ScamTrendRow }) {
  const risk = RISK_BADGE[trend.risk_level]
  const status = STATUS_BADGE[trend.status]

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <p className="font-bold text-slate-900 text-sm leading-snug">{trend.title_lt}</p>
          <code className="text-[10px] font-mono text-slate-400">{trend.id}</code>
        </div>
        <span
          className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border flex-shrink-0 ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      {trend.explanation_lt && (
        <p className="text-xs text-slate-600 leading-relaxed mb-2 line-clamp-2">{trend.explanation_lt}</p>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${risk.bg} ${risk.text} ${risk.border}`}>
          {risk.label}
        </span>
        <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
          bazinis {trend.base_weight}
        </span>
        <span className="text-[10px] font-mono text-slate-400">
          atnaujinta {new Date(trend.updated_at).toLocaleDateString('lt-LT')}
        </span>
      </div>
    </div>
  )
}

// ─── New trend form ───────────────────────────────────────────────────────────

function NewTrendForm() {
  return (
    <section className="bg-white border border-slate-200 rounded-xl p-5">
      <h2 className="text-sm font-bold text-slate-800 mb-1 uppercase tracking-wide">Naujas trendas</h2>
      <p className="text-xs text-slate-500 mb-4 leading-relaxed">
        Sukuriama su būsena <strong>draft</strong>. Draft trendai neveikia viešoje analizėje.
        Šablonų (frazių / regex) ir pavyzdžių redagavimas bei aktyvavimas bus pridėti vėlesniame etape.
      </p>

      <form action={createTrendDraftAction} className="space-y-4">
        <Field label="Pavadinimas (LT)" required>
          <input name="title_lt" type="text" required className={inputClass} placeholder="pvz. Netikri „Energijos kompensacijos“ SMS" />
        </Field>

        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Pavadinimas (EN)">
            <input name="title_en" type="text" className={inputClass} />
          </Field>
          <Field label="Pavadinimas (DE)">
            <input name="title_de" type="text" className={inputClass} />
          </Field>
          <Field label="Pavadinimas (RU)">
            <input name="title_ru" type="text" className={inputClass} />
          </Field>
        </div>

        <Field label="Paaiškinimas (LT)">
          <textarea name="explanation_lt" rows={2} className={inputClass} placeholder="Kaip ši schema veikia" />
        </Field>

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Sukčiaus tikslas (LT)">
            <textarea name="scammer_goal_lt" rows={2} className={inputClass} />
          </Field>
          <Field label="Saugus veiksmas (LT)">
            <textarea name="safe_action_lt" rows={2} className={inputClass} />
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Rizikos lygis">
            <select name="risk_level" defaultValue="vidutine" className={inputClass}>
              {RISK_LEVELS.map(level => (
                <option key={level} value={level}>{RISK_BADGE[level].label}</option>
              ))}
            </select>
          </Field>
          <Field label="Bazinis svoris (0–100)">
            <input name="base_weight" type="number" min={0} max={100} step={1} defaultValue={5} className={inputClass} />
          </Field>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-[11px] text-slate-400 font-mono">
            būsena: draft (fiksuota)
          </p>
          <button
            type="submit"
            className="py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-sm transition-colors"
          >
            Sukurti draft trendą
          </button>
        </div>
      </form>
    </section>
  )
}

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:border-brand transition-colors'

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  )
}
