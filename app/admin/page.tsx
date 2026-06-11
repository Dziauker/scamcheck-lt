// ─── ScamCheck LT v0.3 — Admin Panel Lite dashboard ──────────────────────────
//
// READ-ONLY viewer for the scam detection knowledge base. It renders the data
// that powers lib/scamEngine.ts (categories, weighted patterns, test cases and
// cross-category risk signals) so it can be inspected in the browser instead of
// in source files. It does NOT edit, save or change any detection behaviour.

import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/adminAuth'
import { APP_VERSION, KNOWLEDGE_BASE_VERSION } from '@/constants/appMeta'
import { getCategoryLabel } from '@/constants/categories'
import {
  SCAM_CATEGORIES,
  SOURCE_LABELS_LT,
  ScamCategory,
  ScamPattern,
} from '@/knowledge/scamPatterns'
import { SCAM_TEST_CASES, ScamTestCase } from '@/knowledge/testCases'
import { RISK_SIGNALS, RiskSignal } from '@/knowledge/riskSignals'
import { RiskLevel } from '@/lib/types'

export const dynamic = 'force-dynamic'

// ─── Risk badge config (mirrors the consumer risk palette) ───────────────────

const RISK_BADGE: Record<RiskLevel, { label: string; bg: string; text: string; border: string }> = {
  zema:     { label: 'ŽEMA',     bg: 'bg-risk-low-bg',  text: 'text-risk-low-text',  border: 'border-risk-low-border' },
  vidutine: { label: 'VIDUTINĖ', bg: 'bg-risk-mid-bg',  text: 'text-risk-mid-text',  border: 'border-risk-mid-border' },
  auksta:   { label: 'AUKŠTA',   bg: 'bg-risk-high-bg', text: 'text-risk-high-text', border: 'border-risk-high-border' },
  kritine:  { label: 'KRITINĖ',  bg: 'bg-risk-crit-bg', text: 'text-risk-crit-text', border: 'border-risk-crit-border' },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  if (!isAdminAuthenticated()) {
    redirect('/admin/login')
  }

  // ── Aggregate stats from the knowledge base ──
  const categoryPatterns = SCAM_CATEGORIES.flatMap(c => c.patterns)
  const phrasePatternCount = categoryPatterns.filter(p => p.kind === 'phrase').length
  const regexPatternCount = categoryPatterns.filter(p => p.kind === 'regex').length
  const criticalSignalCount = RISK_SIGNALS.filter(s => s.critical).length

  const stats: { label: string; value: string; hint?: string }[] = [
    { label: 'Scam kategorijos', value: String(SCAM_CATEGORIES.length) },
    { label: 'Frazių šablonai (su svoriais)', value: String(phrasePatternCount) },
    { label: 'Regex šablonai', value: String(regexPatternCount) },
    { label: 'Testiniai atvejai', value: String(SCAM_TEST_CASES.length) },
    { label: 'Kritiniai signalai', value: String(criticalSignalCount), hint: `iš ${RISK_SIGNALS.length} signalų grupių` },
    { label: 'Versija', value: APP_VERSION, hint: `žinių bazė ${KNOWLEDGE_BASE_VERSION}` },
  ]

  return (
    <div className="space-y-6">

      {/* ── Title ── */}
      <div>
        <p className="text-[11px] font-mono uppercase tracking-widest text-slate-400 mb-1">
          Žinių bazės peržiūra
        </p>
        <h1 className="text-2xl font-black text-slate-900">Valdymo panelė</h1>
      </div>

      {/* ── Read-only notice (required internal labels) ── */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <p className="text-sm font-bold text-amber-900 mb-1.5 flex items-center gap-2">
          <span aria-hidden="true">🔒</span> Tik peržiūra
        </p>
        <ul className="text-xs text-amber-800 space-y-1 leading-relaxed">
          <li>• Redagavimas bus pridėtas vėlesniame etape.</li>
          <li>• Šie duomenys naudojami scam detection engine.</li>
        </ul>
      </div>

      {/* ── Overview stats ── */}
      <section>
        <SectionHeading>Apžvalga</SectionHeading>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {stats.map(s => (
            <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-3.5">
              <p className="text-2xl font-black text-slate-900 leading-none">{s.value}</p>
              <p className="text-[11px] font-semibold text-slate-500 mt-1.5 leading-tight">{s.label}</p>
              {s.hint && <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{s.hint}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* ── Scam categories ── */}
      <section>
        <SectionHeading count={SCAM_CATEGORIES.length}>Scam kategorijos</SectionHeading>
        <p className="text-xs text-slate-500 mb-3 leading-relaxed">
          Iš <code className="font-mono">knowledge/scamPatterns.ts</code>. Spustelėkite kategoriją, kad išskleistumėte.
        </p>
        <div className="space-y-2.5">
          {SCAM_CATEGORIES.map(cat => (
            <CategoryCard key={cat.id} cat={cat} />
          ))}
        </div>
      </section>

      {/* ── Test cases ── */}
      <section>
        <SectionHeading count={SCAM_TEST_CASES.length}>Testiniai atvejai</SectionHeading>
        <p className="text-xs text-slate-500 mb-3 leading-relaxed">
          Iš <code className="font-mono">knowledge/testCases.ts</code>. Naudojami <code className="font-mono">npm test</code> metu.
        </p>
        <div className="space-y-2">
          {SCAM_TEST_CASES.map(tc => (
            <TestCaseCard key={tc.id} tc={tc} />
          ))}
        </div>
      </section>

      {/* ── Critical / risk signals ── */}
      <section>
        <SectionHeading count={RISK_SIGNALS.length}>Kritiniai signalai</SectionHeading>
        <p className="text-xs text-slate-500 mb-3 leading-relaxed">
          Iš <code className="font-mono">knowledge/riskSignals.ts</code>. Kritiniai signalai patys vieni nustato KRITINĘ riziką.
        </p>
        <div className="space-y-2">
          {RISK_SIGNALS.map(sig => (
            <SignalCard key={sig.id} sig={sig} />
          ))}
        </div>
      </section>
    </div>
  )
}

// ─── Shared bits ──────────────────────────────────────────────────────────────

function SectionHeading({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2 uppercase tracking-wide">
      {children}
      {count !== undefined && (
        <span className="text-[11px] font-mono font-semibold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
          {count}
        </span>
      )}
    </h2>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{children}</p>
  )
}

function PatternRow({ p }: { p: ScamPattern }) {
  const isRegex = p.kind === 'regex'
  return (
    <li className="flex items-start gap-2 py-1.5 border-b border-slate-100 last:border-0">
      <span
        className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 ${
          isRegex ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
        }`}
      >
        {p.kind}
      </span>
      <span className="text-[10px] font-mono font-bold text-slate-400 flex-shrink-0 mt-1">
        w{p.weight}
      </span>
      <div className="min-w-0 flex-1">
        <code className="text-xs font-mono text-slate-800 break-all">{p.value}</code>
        {p.noteLt && <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{p.noteLt}</p>}
      </div>
    </li>
  )
}

// ─── Scam category card ───────────────────────────────────────────────────────

function CategoryCard({ cat }: { cat: ScamCategory }) {
  const phraseCount = cat.patterns.filter(p => p.kind === 'phrase').length
  const regexCount = cat.patterns.filter(p => p.kind === 'regex').length

  return (
    <details className="bg-white border border-slate-200 rounded-xl overflow-hidden group">
      <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
        <div className="min-w-0">
          <p className="font-bold text-slate-900 text-sm leading-snug">{cat.nameLt}</p>
          <code className="text-[10px] font-mono text-slate-400">{cat.id}</code>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
            bazinis {cat.baseWeight}
          </span>
          <span className="text-slate-400 text-xs group-open:rotate-180 transition-transform">▼</span>
        </div>
      </summary>

      <div className="px-4 pb-4 pt-1 space-y-3.5 border-t border-slate-100">
        {/* Explanation */}
        <div>
          <FieldLabel>Paaiškinimas</FieldLabel>
          <p className="text-sm text-slate-700 leading-relaxed">{cat.explanationLt}</p>
        </div>

        {/* Red flags */}
        <div>
          <FieldLabel>Raudonos vėliavėlės</FieldLabel>
          <ul className="space-y-1">
            {cat.redFlagsLt.map((flag, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="text-amber-500 flex-shrink-0 mt-0.5">⚑</span>
                <span className="leading-snug">{flag}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Scammer goal + safe action */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="bg-red-50 border border-red-100 rounded-lg p-3">
            <FieldLabel>🎯 Sukčiaus tikslas</FieldLabel>
            <p className="text-xs text-red-900 leading-snug">{cat.scammerGoalLt}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
            <FieldLabel>🛡️ Saugus veiksmas</FieldLabel>
            <p className="text-xs text-emerald-900 leading-snug">{cat.safeActionLt}</p>
          </div>
        </div>

        {/* Source labels */}
        <div>
          <FieldLabel>Šaltinių žymos</FieldLabel>
          <div className="flex flex-wrap gap-1.5">
            {cat.sources.map(src => (
              <span
                key={src}
                className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                title={src}
              >
                {SOURCE_LABELS_LT[src]}
              </span>
            ))}
          </div>
        </div>

        {/* Example messages */}
        <div>
          <FieldLabel>Pavyzdinės žinutės</FieldLabel>
          <div className="space-y-1.5">
            {cat.examplesLt.map((ex, i) => (
              <p
                key={i}
                className="text-xs text-slate-600 italic bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 leading-relaxed"
              >
                „{ex}"
              </p>
            ))}
          </div>
        </div>

        {/* Patterns */}
        <div>
          <FieldLabel>
            Šablonai · {phraseCount} frazių / {regexCount} regex
          </FieldLabel>
          <ul className="mt-1">
            {cat.patterns.map((p, i) => (
              <PatternRow key={i} p={p} />
            ))}
          </ul>
        </div>
      </div>
    </details>
  )
}

// ─── Test case card ───────────────────────────────────────────────────────────

function TestCaseCard({ tc }: { tc: ScamTestCase }) {
  // Positive cases assert a scam type is detected; negative cases don't.
  const isPositive = !!tc.expectCategories && tc.expectCategories.length > 0
  const min = RISK_BADGE[tc.expectMinLevel]
  const max = tc.expectMaxLevel ? RISK_BADGE[tc.expectMaxLevel] : undefined

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <code className="text-[10px] font-mono text-slate-400">{tc.id}</code>
          <p className="text-sm font-semibold text-slate-800 leading-snug">{tc.description}</p>
        </div>
        <span
          className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0 ${
            isPositive ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {isPositive ? 'Teigiamas' : 'Neigiamas'}
        </span>
      </div>

      {/* Input preview */}
      <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-2 leading-relaxed mb-2 line-clamp-3">
        {tc.text}
      </p>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-mono text-slate-400">{getCategoryLabel(tc.category)}</span>
        <span className="text-slate-300">·</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${min.bg} ${min.text} ${min.border}`}>
          min {min.label}
        </span>
        {max && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${max.bg} ${max.text} ${max.border}`}>
            max {max.label}
          </span>
        )}
        {tc.expectCategories?.map(c => (
          <span key={c} className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
            {c}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Risk signal card ─────────────────────────────────────────────────────────

function SignalCard({ sig }: { sig: RiskSignal }) {
  const phraseCount = sig.patterns.filter(p => p.kind === 'phrase').length
  const regexCount = sig.patterns.filter(p => p.kind === 'regex').length

  return (
    <div
      className={`bg-white border rounded-xl p-3.5 ${
        sig.critical ? 'border-risk-crit-border' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 leading-snug">{sig.nameLt}</p>
          <code className="text-[10px] font-mono text-slate-400">{sig.id}</code>
        </div>
        {sig.critical && (
          <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-risk-crit-bg text-risk-crit-text border border-risk-crit-border flex-shrink-0">
            Kritinis
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mt-2">
        <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
          svoris {sig.weight}
        </span>
        <span className="text-[10px] font-mono bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
          {phraseCount} frazių
        </span>
        {regexCount > 0 && (
          <span className="text-[10px] font-mono bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">
            {regexCount} regex
          </span>
        )}
      </div>
    </div>
  )
}
