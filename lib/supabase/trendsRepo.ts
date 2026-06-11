// ─── ScamCheck LT v0.5 — Trend Manager data access (SERVER ONLY) ─────────────
//
// A thin PostgREST data-access layer for admin-managed scam trends. It talks to
// the Supabase REST endpoint with `fetch` and the service-role key — so it must
// only ever be imported from server components or server actions.
//
// Deliberately NO dependency on @supabase/supabase-js: this keeps the app's
// minimal-dependency footprint and guarantees the bundle can never ship the
// service-role key to the browser.
//
// IMPORTANT: nothing in lib/scamEngine.ts, lib/mockAnalysis.ts or the public UI
// imports this module. DB trends are an inert overlay in v0.5 and do not affect
// public detection. Engine wiring of `status = 'active'` trends is a later step.

import { getSupabaseConfig } from './config'
import { ScamTrendRow, NewTrendDraft, AuditLogEntry } from './types'

function assertServer(): void {
  if (typeof window !== 'undefined') {
    throw new Error('lib/supabase/trendsRepo is server-only and must not run in the browser')
  }
}

async function rest(path: string, init: RequestInit = {}): Promise<Response> {
  const cfg = getSupabaseConfig()
  if (!cfg) throw new Error('Supabase nesukonfigūruotas (trūksta SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).')
  return fetch(`${cfg.url}/rest/v1/${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      apikey: cfg.serviceRoleKey,
      Authorization: `Bearer ${cfg.serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
}

export type ListTrendsResult =
  | { ok: true; trends: ScamTrendRow[] }
  | { ok: false; error: string }

export async function listTrends(): Promise<ListTrendsResult> {
  assertServer()
  try {
    const res = await rest('scam_trends?select=*&order=updated_at.desc', { method: 'GET' })
    if (!res.ok) {
      return { ok: false, error: `Nepavyko nuskaityti trendų (Supabase ${res.status}).` }
    }
    const trends = (await res.json()) as ScamTrendRow[]
    return { ok: true, trends }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export type CreateTrendResult =
  | { ok: true; trend: ScamTrendRow }
  | { ok: false; error: string }

export async function createTrendDraft(draft: NewTrendDraft): Promise<CreateTrendResult> {
  assertServer()
  try {
    // Status is ALWAYS forced to 'draft' here — new trends never go live on
    // creation, regardless of any caller input.
    const body = { ...draft, status: 'draft' as const }
    const res = await rest('scam_trends', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const detail = await res.text()
      return { ok: false, error: `Nepavyko išsaugoti trendo (Supabase ${res.status}). ${detail}`.trim() }
    }
    const rows = (await res.json()) as ScamTrendRow[]
    const trend = rows[0]
    if (!trend) return { ok: false, error: 'Supabase negrąžino sukurto trendo.' }
    return { ok: true, trend }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// Append-only audit logging. Must never block or fail the primary action, so
// any error here is swallowed (best-effort trail).
export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  assertServer()
  try {
    await rest('admin_audit_log', { method: 'POST', body: JSON.stringify(entry) })
  } catch {
    // intentionally ignored
  }
}
