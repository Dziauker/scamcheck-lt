'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORIES } from '@/constants/categories'
import { DEMO_EXAMPLES, DemoExample } from '@/constants/demoExamples'
import { getMockAnalysis } from '@/lib/mockAnalysis'
import { MessageCategory, Situation, SubmissionInput } from '@/lib/types'

type FormState = 'idle' | 'analyzing'

const LOADING_STEPS = [
  'Analizuojama žinutė...',
  'Tikrinami rizikos požymiai...',
  'Vertinami sukčiavimo šablonai...',
  'Ruošiamas rezultatas...',
]

const SITUATIONS: { value: Situation; label: string; severe?: boolean }[] = [
  { value: 'none',              label: 'Dar nieko nedariau' },
  { value: 'clicked_link',      label: 'Jau paspaudžiau nuorodą' },
  { value: 'entered_card',      label: 'Jau įvedžiau kortelės duomenis',         severe: true },
  { value: 'confirmed_smartid', label: 'Jau patvirtinau Smart-ID / Mobile-ID',   severe: true },
  { value: 'sent_money',        label: 'Jau pervedžiau pinigus',                  severe: true },
]

export default function SubmissionForm() {
  const router = useRouter()
  const [state, setState]         = useState<FormState>('idle')
  const [category, setCategory]   = useState<MessageCategory | null>(null)
  const [situation, setSituation] = useState<Situation>('none')
  const [text, setText]           = useState('')
  const [url, setUrl]             = useState('')
  const [error, setError]         = useState('')
  const [loadingMsg, setLoadingMsg] = useState(LOADING_STEPS[0])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const canSubmit = category !== null && text.trim().length >= 10

  function startLoading() {
    let i = 0
    intervalRef.current = setInterval(() => {
      i = (i + 1) % LOADING_STEPS.length
      setLoadingMsg(LOADING_STEPS[i])
    }, 850)
  }
  function stopLoading() {
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  function loadExample(ex: DemoExample) {
    setCategory(ex.category)
    setSituation(ex.situation)
    setText(ex.text)
    setUrl(ex.url ?? '')
    setError('')
    // scroll to textarea for clarity
    setTimeout(() => document.getElementById('msg-text')?.focus(), 50)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || !category) return
    if (text.trim().length < 10) { setError('Įveskite bent 10 simbolių tekstą.'); return }
    if (text.length > 5000)      { setError('Tekstas per ilgas (max 5000 simbolių).'); return }

    setError('')
    setState('analyzing')
    startLoading()

    try {
      const input: SubmissionInput = {
        text: text.trim(),
        category,
        situation,
        url: url.trim() || undefined,
      }

      await new Promise(r => setTimeout(r, 2600))

      const result = getMockAnalysis(input)
      sessionStorage.setItem(`case_${result.case_id}`, JSON.stringify(result))

      stopLoading()
      router.push(`/rezultatai/${result.case_id}`)
    } catch {
      stopLoading()
      setState('idle')
      setError('Įvyko klaida. Bandykite dar kartą.')
    }
  }

  if (state === 'analyzing') {
    return <LoadingScreen message={loadingMsg} category={category} />
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Demo examples */}
      <DemoExamplesBlock onPick={loadExample} />

      {/* Situation selector */}
      <fieldset>
        <legend className="block text-sm font-semibold text-gray-800 mb-2">
          Kas jau įvyko?
        </legend>
        <div className="flex flex-col gap-1.5">
          {SITUATIONS.map(s => {
            const selected = situation === s.value
            return (
              <label
                key={s.value}
                className={`
                  flex items-center gap-3 px-3.5 py-2.5 rounded-lg border-2 cursor-pointer
                  text-sm transition-colors select-none
                  ${selected
                    ? s.severe
                      ? 'border-red-400 bg-red-50 text-red-800'
                      : 'border-brand bg-blue-50 text-blue-800'
                    : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                  }
                `}
              >
                <input
                  type="radio"
                  name="situation"
                  value={s.value}
                  checked={selected}
                  onChange={() => setSituation(s.value)}
                  className="sr-only"
                />
                <span
                  className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                    ${selected
                      ? s.severe ? 'border-red-500' : 'border-brand'
                      : 'border-gray-300'
                    }`}
                  aria-hidden="true"
                >
                  {selected && (
                    <span className={`w-2 h-2 rounded-full ${s.severe ? 'bg-red-500' : 'bg-brand'}`} />
                  )}
                </span>
                <span className="font-medium">{s.label}</span>
              </label>
            )
          })}
        </div>
      </fieldset>

      {/* Privacy reminder (short) */}
      <PrivacyWarning />

      {/* Textarea (visually dominant) */}
      <div>
        <label htmlFor="msg-text" className="block text-sm font-semibold text-gray-800 mb-2">
          Įklijuokite įtartiną tekstą <span className="text-red-500">*</span>
        </label>
        <textarea
          id="msg-text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Įklijuokite žinutę, SMS, el. laišką ar skelbimo tekstą čia..."
          rows={8}
          maxLength={5000}
          className="
            w-full px-4 py-3.5 rounded-xl border-2 border-gray-200
            bg-white text-gray-800 placeholder-gray-400
            focus:border-brand focus:outline-none
            resize-none text-[15px] leading-relaxed transition-colors
          "
        />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-400">Min. 10 simbolių</span>
          <span className={`text-xs ${text.length > 4500 ? 'text-orange-500 font-medium' : 'text-gray-400'}`}>
            {text.length} / 5000
          </span>
        </div>
      </div>

      {/* Category chips */}
      <fieldset>
        <legend className="block text-sm font-semibold text-gray-800 mb-2">
          Žinutės tipas <span className="text-red-500">*</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => {
            const selected = category === cat.value
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`
                  text-sm px-3.5 py-1.5 rounded-full border-2 font-medium transition-colors
                  ${selected
                    ? 'border-brand bg-brand text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {cat.chipLabel}
              </button>
            )
          })}
        </div>
      </fieldset>

      {/* Optional URL */}
      <div>
        <label htmlFor="url-input" className="block text-sm font-semibold text-gray-800 mb-2">
          Nuoroda <span className="text-xs font-normal text-gray-500">(neprivaloma)</span>
        </label>
        <input
          id="url-input"
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://..."
          className="
            w-full px-4 py-3 rounded-xl border-2 border-gray-200
            bg-white text-gray-700 placeholder-gray-400 font-mono text-sm
            focus:border-brand focus:outline-none transition-colors
          "
        />
        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
          Nuorodos neatidarome — prototipas tik pasyviai tikrina jos formą ir domeno požymius.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className={`
          w-full py-4 rounded-xl font-bold text-base tracking-tight
          transition-all duration-200
          ${canSubmit
            ? 'bg-brand hover:bg-blue-700 text-white shadow-md hover:shadow-lg active:scale-[0.99]'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        Analizuoti riziką →
      </button>

      <p className="text-center text-xs text-gray-400 pb-1">
        Demo vertinimas · Prototipe tekstas apdorojamas tik naršyklės sesijoje
      </p>
    </form>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function DemoExamplesBlock({ onPick }: { onPick: (ex: DemoExample) => void }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        Demo pavyzdžiai
        <span className="font-normal text-gray-400 normal-case tracking-normal"> (paspaudus užpildo formą)</span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {DEMO_EXAMPLES.map(ex => (
          <button
            key={ex.id}
            type="button"
            onClick={() => onPick(ex)}
            className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-700 transition-colors"
          >
            {ex.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function PrivacyWarning() {
  return (
    <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-lg px-3.5 py-2.5">
      <p className="text-xs text-amber-900 leading-relaxed">
        <span className="font-semibold">Saugumo priminimas: </span>
        Neįklijuokite slaptažodžių, CVV, Smart-ID kodų ar pilnų kortelės numerių.
      </p>
    </div>
  )
}

function LoadingScreen({ message, category }: { message: string; category: MessageCategory | null }) {
  const catLabel = CATEGORIES.find(c => c.value === category)?.label ?? ''
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="relative w-20 h-20 mb-8">
        <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
        <div className="absolute inset-0 rounded-full border-4 border-t-brand animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 26 26" fill="none" aria-hidden="true">
            <path d="M13 1.5L3.5 5.5v7c0 5.2 4 10.1 9.5 11.5C18.5 22.6 22.5 17.7 22.5 12.5v-7L13 1.5z" fill="#2563eb" />
            <path d="M9.5 13l2.8 2.8 4.7-5.6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {catLabel && (
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-2">
          {catLabel}
        </p>
      )}
      <p className="text-lg font-bold text-gray-800 mb-2">{message}</p>
      <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
        Tikrinami sukčiavimo šablonai.<br />
        Tai užtruks kelias sekundes.
      </p>

      <div className="flex gap-1.5 mt-7">
        {[0, 0.15, 0.3].map((delay, i) => (
          <div
            key={i}
            className="w-2 h-2 bg-blue-300 rounded-full animate-bounce"
            style={{ animationDelay: `${delay}s` }}
          />
        ))}
      </div>
    </div>
  )
}
