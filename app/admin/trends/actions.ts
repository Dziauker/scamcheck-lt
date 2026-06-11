// ─── ScamCheck LT v0.5 — Admin Trend Manager server actions ──────────────────
//
// Server-only. Creates DRAFT scam trends in Supabase. Every action:
//   1. re-checks the admin session (defence in depth — never trusts the UI),
//   2. validates all input (allowed risk levels, bounded weights, required LT
//      title) before any write,
//   3. forces status = 'draft' (the repo also enforces this),
//   4. writes an append-only audit-log entry.
//
// Results are surfaced back to the page via redirect query params, mirroring the
// existing /admin/login pattern.

'use server'

import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/adminAuth'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createTrendDraft, writeAuditLog } from '@/lib/supabase/trendsRepo'
import { validateNewTrendDraft } from '@/lib/supabase/validation'

export async function createTrendDraftAction(formData: FormData) {
  if (!isAdminAuthenticated()) {
    redirect('/admin/login')
  }
  if (!isSupabaseConfigured()) {
    redirect('/admin/trends?error=not_configured')
  }

  const validated = validateNewTrendDraft({
    title_lt: formData.get('title_lt'),
    title_en: formData.get('title_en'),
    title_de: formData.get('title_de'),
    title_ru: formData.get('title_ru'),
    explanation_lt: formData.get('explanation_lt'),
    scammer_goal_lt: formData.get('scammer_goal_lt'),
    safe_action_lt: formData.get('safe_action_lt'),
    risk_level: formData.get('risk_level'),
    base_weight: formData.get('base_weight'),
    created_by: 'admin',
  })

  if (!validated.ok) {
    redirect(`/admin/trends?error=validation&msg=${encodeURIComponent(validated.error)}`)
  }

  const created = await createTrendDraft(validated.value)
  if (!created.ok) {
    redirect(`/admin/trends?error=save&msg=${encodeURIComponent(created.error)}`)
  }

  await writeAuditLog({
    admin_action: 'create_trend_draft',
    entity_type: 'scam_trend',
    entity_id: created.trend.id,
    before_json: null,
    after_json: created.trend,
  })

  redirect('/admin/trends?created=1')
}
