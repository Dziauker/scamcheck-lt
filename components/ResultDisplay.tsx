'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnalysisResult, RiskLevel, QuickAnswer, UrlAnalysisResult, DetectedScamType } from '@/lib/types'
import { getCategoryLabel } from '@/constants/categories'
import { PUBLIC_VERSION_LABEL } from '@/constants/appMeta'

// ─── Risk config ─────────────────────────────────────────────────────────────

const RISK = {
  zema: {
    label:      'ŽEMA RIZIKA',
    badgeBg:    'bg-risk-low',
    sectionBg:  'bg-risk-low-bg',
    border:     'border-risk-low-border',
    text:       'text-risk-low-text',
    dot:        'bg-risk-low',
    icon:       '✓',
  },
  vidutine: {
    label:      'VIDUTINĖ RIZIKA',
    badgeBg:    'bg-risk-mid',
    sectionBg:  'bg-risk-mid-bg',
    border:     'border-risk-mid-border',
    text:       'text-risk-mid-text',
    dot:        'bg-risk-mid',
    icon:       '!',
  },
  auksta: {
    label:      'AUKŠTA RIZIKA',
    badgeBg:    'bg-risk-high',
    sectionBg:  'bg-risk-high-bg',
    border:     'border-risk-high-border',
    text:       'text-risk-high-text',
    dot:        'bg-risk-high',
    icon:       '!!',
  },
  kritine: {
    label:      'KRITINĖ RIZIKA',
    badgeBg:    'bg-risk-crit',
    sectionBg:  'bg-risk-crit-bg',
    border:     'border-risk-crit-border',
    text:       'text-risk-crit-text',
    dot:        'bg-risk-crit',
    icon:       '!!!',
  },
} satisfies Record<RiskLevel, {
  label: string
  badgeBg: string
  sectionBg: string
  border: string
  text: string
  dot: string
  icon: string
}>

// ─── Quick answer config (FIX H1) ────────────────────────────────────────────

const QA_LABELS: Record<QuickAnswer, { label: string; bg: string; text: string }> = {
  ne:       { label: 'NE',       bg: 'bg-red-100',    text: 'text-red-700' },
  atsargiai:{ label: 'ATSARGIAI',bg: 'bg-amber-100',  text: 'text-amber-700' },
  taip:     { label: 'TAIP',     bg: 'bg-emerald-100',text: 'text-emerald-700' },
  nezinoma: { label: '—',        bg: 'bg-gray-100',   text: 'text-gray-500' },
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ResultDisplay({ caseId }: { caseId: string }) {
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [showHumanReview, setShowHumanReview] = useState(false)
  const [caseDeleted, setCaseDeleted] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem(`case_${caseId}`)
    if (raw) setResult(JSON.parse(raw))
  }, [caseId])

  if (caseDeleted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-5xl mb-4">🗑️</p>
        <p className="font-semibold text-gray-700 mb-1">Byla ištrinta.</p>
        <Link href="/" className="text-brand text-sm underline">Grįžti į pradžią</Link>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 mb-3">Byla nerasta arba baigėsi sesija.</p>
        <Link href="/" className="text-brand text-sm underline">Tikrinti naują žinutę</Link>
      </div>
    )
  }

  const R = RISK[result.risk_level]

  async function copyReply() {
    await navigator.clipboard.writeText(result!.safe_reply)
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  function deleteCase() {
    sessionStorage.removeItem(`case_${caseId}`)
    setCaseDeleted(true)
  }

  // FIX H3: human-readable category label
  const categoryLabel = getCategoryLabel(result.category)

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 pb-10 space-y-3.5 animate-fade-in">

      {/* ── Risk badge ── */}
      <div className={`${R.badgeBg} rounded-2xl p-5 text-white`}>
        {/* Top row: category + case ID */}
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-2">
            {/* FIX H3: show readable category label, not raw value */}
            <span className="text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-full uppercase tracking-wide">
              {categoryLabel}
            </span>
          </div>
          <span className="text-xs font-mono opacity-70 flex-shrink-0">{result.case_id}</span>
        </div>

        {/* Risk label */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-white/25 flex items-center justify-center font-black text-sm flex-shrink-0">
            {R.icon}
          </div>
          <p className="text-2xl font-black tracking-tight leading-none">{R.label}</p>
        </div>

        {/* Verdict */}
        <p className="text-sm font-medium leading-relaxed bg-white/15 rounded-xl px-4 py-3">
          {result.short_verdict}
        </p>

        {/* Timestamp */}
        <p className="text-xs opacity-50 mt-2 font-mono">
          {new Date(result.analyzed_at).toLocaleString('lt-LT')} · Demo vertinimas
        </p>
      </div>

      {/* ── Ką daryti dabar (per-level) ── */}
      <DoNowBlock riskLevel={result.risk_level} items={result.do_now} />

      {/* ── Quick answers ── */}
      <QuickAnswersBlock answers={result.quick_answers} hasUrl={!!result.url_analysis} />

      {/* ── Red flags ── */}
      {result.red_flags.length > 0 && (
        <Section title="Raudonos vėliavėlės" emoji="⚠️" className={`${R.sectionBg} border ${R.border}`}>
          <ul className="space-y-2">
            {result.red_flags.map((flag, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <span className={`w-1.5 h-1.5 rounded-full ${R.dot} flex-shrink-0 mt-[6px]`} />
                <span className={R.text}>{flag}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* ── Why suspicious ── */}
      {result.why_suspicious.length > 0 && (
        <Section title="Kodėl tai įtartina" emoji="🔍">
          <div className="space-y-2">
            {result.why_suspicious.map((p, i) => (
              <p key={i} className="text-sm text-gray-700 leading-relaxed">{p}</p>
            ))}
          </div>
        </Section>
      )}

      {/* ── v0.2: Detected scam types ── */}
      {result.detected_scam_types && result.detected_scam_types.length > 0 && (
        <DetectedScamTypesSection
          types={result.detected_scam_types}
          riskLevel={result.risk_level}
        />
      )}

      {/* ── Do not do ── */}
      {result.do_not_do.length > 0 && (
        <Section title="Ko nedaryti" emoji="🚫" className="bg-red-50 border border-red-200">
          <ul className="space-y-2">
            {result.do_not_do.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <span className="text-red-500 font-bold flex-shrink-0 leading-snug mt-0.5">✕</span>
                <span className="text-red-800 font-medium leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* ── Verify ── */}
      <Section title="Ką patikrinti prieš veikiant" emoji="✅">
        {/* FIX M2: static numbered bullets, not fake checkboxes */}
        <ol className="space-y-2">
          {result.verify_before_acting.map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
              <span className="w-5 h-5 rounded-full border-2 border-gray-300 text-gray-400 flex-shrink-0 flex items-center justify-center text-[10px] font-bold">
                {i + 1}
              </span>
              <span className="leading-snug pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </Section>

      {/* ── Safe reply / no-reply guidance ── */}
      {result.risk_level === 'kritine' ? (
        <Section title="Atsakymas" emoji="🚫" className="bg-red-50 border border-red-200">
          <p className="text-sm text-red-800 font-medium leading-relaxed">
            {result.safe_reply}
          </p>
        </Section>
      ) : (
        <Section title="Saugus atsakymo variantas" emoji="💬">
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 mb-3">
            <p className="text-sm text-gray-700 italic leading-relaxed">
              „{result.safe_reply}"
            </p>
          </div>
          <button
            onClick={copyReply}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold transition-colors"
          >
            {copied ? '✓ Nukopijuota' : '📋 Kopijuoti atsakymą'}
          </button>
        </Section>
      )}

      {/* ── Next steps ── */}
      <Section title="Rekomenduojami veiksmai" emoji="📋">
        <ol className="space-y-2">
          {result.next_steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex-shrink-0 flex items-center justify-center text-xs font-bold">
                {i + 1}
              </span>
              <span className="text-gray-700 pt-0.5 leading-snug">{step}</span>
            </li>
          ))}
        </ol>
      </Section>

      {/* ── URL analysis ── */}
      {result.url_analysis && (
        <UrlSection analysis={result.url_analysis} />
      )}

      {/* ── Human review CTA ── */}
      {result.human_review.recommended && !showHumanReview && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <div className="flex gap-3 mb-4">
            <span className="text-2xl flex-shrink-0">👁️</span>
            <div>
              <p className="font-semibold text-blue-900">Rekomenduojama žmogaus peržiūra</p>
              <p className="text-sm text-blue-700 mt-1 leading-relaxed">{result.human_review.reason}</p>
            </div>
          </div>
          <button
            onClick={() => setShowHumanReview(true)}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors"
          >
            Prašyti žmogaus peržiūros →
          </button>
        </div>
      )}

      {showHumanReview && (
        <HumanReviewForm caseId={result.case_id} onClose={() => setShowHumanReview(false)} />
      )}

      {/* ── Disclaimer ── */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
        <p className="text-xs text-gray-500 leading-relaxed">{result.disclaimer}</p>
        <div className="flex flex-wrap gap-1.5">
          <Chip>Simuliuotas AI vertinimas</Chip>
          <Chip>ScamCheck LT {PUBLIC_VERSION_LABEL}</Chip>
        </div>
      </div>

      {/* ── Footer actions ── */}
      <div className="flex gap-3 pt-1">
        <Link
          href="/"
          className="flex-1 py-3 text-center rounded-xl border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold text-sm transition-colors"
        >
          ↩ Tikrinti kitą žinutę
        </Link>
        <button
          onClick={deleteCase}
          className="px-4 py-3 rounded-xl border-2 border-red-200 hover:bg-red-50 text-red-600 font-semibold text-sm transition-colors"
          title="Ištrinti bylą"
        >
          🗑️
        </button>
      </div>
    </div>
  )
}

// ─── Ką daryti dabar — per-level action block ────────────────────────────────

const DO_NOW_STYLE: Record<RiskLevel, {
  wrap: string; title: string; pillBg: string; pillText: string; itemText: string; emoji: string; heading: string
}> = {
  kritine:  {
    wrap:     'bg-red-50 border border-red-200',
    title:    'text-red-900',
    pillBg:   'bg-red-600',
    pillText: 'text-white',
    itemText: 'text-red-900',
    emoji:    '🚨',
    heading:  'Ką daryti dabar',
  },
  auksta: {
    wrap:     'bg-orange-50 border border-orange-200',
    title:    'text-orange-900',
    pillBg:   'bg-orange-500',
    pillText: 'text-white',
    itemText: 'text-orange-900',
    emoji:    '⚠️',
    heading:  'Ką daryti dabar',
  },
  vidutine: {
    wrap:     'bg-amber-50 border border-amber-200',
    title:    'text-amber-900',
    pillBg:   'bg-amber-500',
    pillText: 'text-white',
    itemText: 'text-amber-900',
    emoji:    '🔎',
    heading:  'Ką daryti dabar',
  },
  zema: {
    wrap:     'bg-emerald-50 border border-emerald-200',
    title:    'text-emerald-900',
    pillBg:   'bg-emerald-600',
    pillText: 'text-white',
    itemText: 'text-emerald-900',
    emoji:    '✅',
    heading:  'Ką daryti dabar',
  },
}

function DoNowBlock({ riskLevel, items }: { riskLevel: RiskLevel; items: string[] }) {
  const s = DO_NOW_STYLE[riskLevel]
  return (
    <div className={`rounded-2xl p-5 ${s.wrap}`}>
      <h2 className={`font-bold mb-3 text-sm flex items-center gap-2 ${s.title}`}>
        <span aria-hidden="true">{s.emoji}</span>
        {s.heading}
      </h2>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            <span className={`w-5 h-5 rounded-full ${s.pillBg} ${s.pillText} flex items-center justify-center text-[10px] font-bold flex-shrink-0`}>
              {i + 1}
            </span>
            <span className={`leading-snug pt-0.5 ${s.itemText}`}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── FIX H1: Quick answers block ─────────────────────────────────────────────

function QuickAnswersBlock({ answers, hasUrl }: {
  answers: AnalysisResult['quick_answers']
  hasUrl: boolean
}) {
  const rows: Array<{ question: string; answer: QuickAnswer; show: boolean }> = [
    { question: 'Ar spausti nuorodą?', answer: answers.clickLink,   show: hasUrl || answers.clickLink !== 'nezinoma' },
    { question: 'Ar mokėti?',          answer: answers.pay,          show: true },
    { question: 'Ar atrašyti?',        answer: answers.reply,        show: true },
    { question: 'Žmogaus peržiūra?',   answer: answers.humanReview,  show: true },
  ]

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Greiti atsakymai
      </p>
      <div className="space-y-2.5">
        {rows.filter(r => r.show).map(({ question, answer }) => {
          const qa = QA_LABELS[answer]
          return (
            <div key={question} className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-700">{question}</span>
              <span className={`text-xs font-black px-3 py-1 rounded-full flex-shrink-0 ${qa.bg} ${qa.text}`}>
                {qa.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

// FIX L1: removed uppercase + tracking-wide from h2 — breaks with emoji
function Section({
  title, emoji, children, className = 'bg-white border border-gray-200',
}: {
  title: string
  emoji: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-2xl p-5 ${className}`}>
      <h2 className="font-bold text-gray-800 mb-3 text-sm flex items-center gap-2">
        <span aria-hidden="true">{emoji}</span>
        {title}
      </h2>
      {children}
    </div>
  )
}

// ─── v0.2: Detected scam types ───────────────────────────────────────────────

const STRENGTH_LABEL: Record<DetectedScamType['match_strength'], string> = {
  galimas:   'Galimas',
  tiketinas: 'Tikėtinas',
}

function DetectedScamTypesSection({
  types, riskLevel,
}: {
  types: DetectedScamType[]
  riskLevel: RiskLevel
}) {
  const multiple = types.length > 1
  // For high / critical risk, make the safe action visually prominent.
  const prominentSafeAction = riskLevel === 'auksta' || riskLevel === 'kritine'

  return (
    <Section
      title={multiple ? 'Atpažinti sukčiavimo tipai' : 'Atpažintas sukčiavimo tipas'}
      emoji="🎭"
    >
      {/* Non-overclaiming framing: these are detected signals, not proof */}
      <p className="text-xs text-gray-500 leading-relaxed mb-4">
        Pagal tekstą aptikti šie galimi sukčiavimo požymiai. Tai demo vertinimas — ne patvirtintas faktas.
      </p>

      <div className="space-y-3">
        {types.map(type => (
          <div key={type.id} className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 space-y-3">
            {/* Name + certainty badge ("galimas" / "tikėtinas" sukčiavimo tipas) */}
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-bold text-gray-800 text-[15px] leading-snug">{type.name_lt}</h3>
              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-500 uppercase tracking-wide flex-shrink-0">
                {STRENGTH_LABEL[type.match_strength]}
              </span>
            </div>

            {/* Short explanation */}
            <p className="text-sm text-gray-600 leading-relaxed">{type.explanation_lt}</p>

            {/* What the scammer wants */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1.5">
                <span aria-hidden="true">🎯</span> Ko siekia sukčius
              </p>
              <p className="text-sm text-gray-700 leading-snug">{type.scammer_goal_lt}</p>
            </div>

            {/* Recommended safe action — prominent on high / critical risk */}
            <div className={
              prominentSafeAction
                ? 'bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5'
                : ''
            }>
              <p className={`text-xs font-semibold mb-1 flex items-center gap-1.5 ${
                prominentSafeAction ? 'text-emerald-800' : 'text-gray-500'
              }`}>
                <span aria-hidden="true">🛡️</span> Saugus veiksmas
              </p>
              <p className={`text-sm leading-snug ${
                prominentSafeAction ? 'text-emerald-900 font-medium' : 'text-gray-700'
              }`}>
                {type.safe_action_lt}
              </p>
            </div>

            {/* Source labels — small muted tags, explicitly not official proof */}
            {type.source_labels_lt.length > 0 && (
              <div className="pt-1">
                <p className="text-[10px] text-gray-400 mb-1.5">
                  Susiję šaltinių tipai (ne įrodymas):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {type.source_labels_lt.map((label, i) => (
                    <span key={i} className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Section>
  )
}

// ─── FIX C2: URL analysis — no "Greičiausiai saugu" overclaim ────────────────

function UrlSection({ analysis }: { analysis: UrlAnalysisResult }) {
  const [open, setOpen] = useState(false)

  // FIX C2: updated verdict labels — no 'likely_safe' → 'no_flags_found'
  const VERDICT_CONFIG = {
    suspicious:    { label: 'Įtartina',            bg: 'bg-red-100',    text: 'text-red-700' },
    unknown:       { label: 'Neatpažinta',          bg: 'bg-amber-100',  text: 'text-amber-700' },
    no_flags_found:{ label: 'Įtartumo nerasta*',   bg: 'bg-gray-100',   text: 'text-gray-600' },
  } satisfies Record<UrlAnalysisResult['verdict'], { label: string; bg: string; text: string }>

  const vc = VERDICT_CONFIG[analysis.verdict]

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg" aria-hidden="true">🔗</span>
          <div>
            <p className="font-bold text-gray-800 text-sm">Techninis URL patikrinimas</p>
            <p className="text-xs text-gray-400 mt-0.5 font-mono truncate max-w-[200px]">
              {analysis.domain_extracted}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${vc.bg} ${vc.text}`}>
            {vc.label}
          </span>
          <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 pt-4 pb-5 space-y-3 animate-fade-in">
          <div className="grid grid-cols-2 gap-2">
            <InfoPill label="Sutrumpinta" value={analysis.shortener_detected ? '⚠️ Taip' : '✓ Ne'} />
            <InfoPill label="Imitacija"   value={analysis.brand_impersonation_detected ? '⚠️ Aptikta' : '✓ Nerasta'} />
          </div>

          {analysis.tld_flags.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-500">Domeno galūnė:</p>
              {analysis.tld_flags.map((f, i) => (
                <p key={i} className="text-xs bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg">{f}</p>
              ))}
            </div>
          )}

          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500">Pastabos:</p>
            {analysis.pattern_notes.map((n, i) => (
              <p key={i} className="text-xs bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg">{n}</p>
            ))}
          </div>

          {/* FIX C2: disclaimer always shown */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
            <p className="text-xs text-amber-700 leading-relaxed">
              * {analysis.warning}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-2.5">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-700">{value}</p>
    </div>
  )
}

// ─── FIX C3: Human review form with prominent prototype disclaimer ─────────────

function HumanReviewForm({ caseId, onClose }: { caseId: string; onClose: () => void }) {
  const [email, setEmail]     = useState('')
  const [notes, setNotes]     = useState('')
  const [urgency, setUrgency] = useState<'normal' | 'urgent'>('normal')
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
        {/* FIX C3: Clear prototype notice on confirmation */}
        <div className="bg-amber-100 border border-amber-300 rounded-xl p-3 mb-4">
          <p className="text-xs font-semibold text-amber-800">
            ⚠️ Prototipo pastaba: žmogaus peržiūra šiame prototype nėra aktyvi.
            Jei turite skubios situacijos — kreipkitės į banką arba policiją (112).
          </p>
        </div>
        <div className="text-center">
          <p className="text-3xl mb-2">✓</p>
          <p className="font-bold text-blue-900 mb-1">Prašymas užregistruotas</p>
          <p className="text-sm text-blue-700">
            Byla <span className="font-mono font-semibold">{caseId}</span> bus peržiūrėta,
            kai žmogaus peržiūros sistema bus aktyvi.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={e => { e.preventDefault(); setSubmitted(true) }}
      className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-blue-900">Prašyti žmogaus peržiūros</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-blue-400 hover:text-blue-600 transition-colors text-lg leading-none"
          aria-label="Uždaryti"
        >
          ✕
        </button>
      </div>

      {/* FIX C3: Prototype warning — prominent, before the form */}
      <div className="bg-amber-100 border border-amber-300 rounded-xl px-3 py-2.5">
        <p className="text-xs font-semibold text-amber-800 leading-relaxed">
          ⚠️ <strong>Prototipo versija:</strong> žmogaus peržiūra šiame prototype nėra aktyvi.
          Jei situacija skubi — nedelsdami susisiekite su banku arba kreipkitės į policiją.
        </p>
      </div>

      <p className="text-sm text-blue-700">
        Jūsų byla <span className="font-mono font-semibold">{caseId}</span> bus peržiūrėta kai sistema bus paleista.
      </p>

      <div>
        <label className="block text-xs font-semibold text-blue-800 mb-1.5">
          El. paštas <span className="font-normal text-blue-500">(neprivaloma)</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="jusu@pastas.lt"
          className="w-full px-3 py-2.5 rounded-lg border border-blue-200 bg-white text-sm focus:outline-none focus:border-blue-400 transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-blue-800 mb-1.5">
          Papildomas komentaras <span className="font-normal text-blue-500">(neprivaloma)</span>
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Pvz.: jau pervedžiau pinigų, noriu patvirtinti ar tai sukčiavimas..."
          rows={3}
          className="w-full px-3 py-2.5 rounded-lg border border-blue-200 bg-white text-sm resize-none focus:outline-none focus:border-blue-400 transition-colors"
        />
      </div>

      <div>
        <p className="text-xs font-semibold text-blue-800 mb-2">Skubumas</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'normal', label: 'Įprasta', sub: 'iki 24 val.' },
            { value: 'urgent', label: '⚡ Skubu', sub: 'galimas pavojus' },
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setUrgency(opt.value as 'normal' | 'urgent')}
              className={`py-2.5 px-3 rounded-xl border-2 text-left transition-all ${
                urgency === opt.value
                  ? 'border-blue-600 bg-blue-100'
                  : 'border-blue-200 bg-white hover:border-blue-300'
              }`}
            >
              <p className="text-sm font-bold text-blue-900">{opt.label}</p>
              <p className="text-xs text-blue-500">{opt.sub}</p>
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors"
      >
        Pateikti prašymą
      </button>
    </form>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs bg-gray-200 text-gray-500 px-2.5 py-1 rounded-full">{children}</span>
  )
}
