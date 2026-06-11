// ─── ScamCheck LT v0.5 — Supabase configuration (SERVER ONLY) ────────────────
//
// Reads the Supabase connection details from server-side environment variables.
// These vars are intentionally NOT prefixed with NEXT_PUBLIC_ so they are never
// bundled into client code:
//
//   SUPABASE_URL               e.g. https://<project-ref>.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY  service-role key — bypasses RLS, server only
//
// The service-role key is a powerful secret. It must only ever live in the
// server environment (.env.local locally, Vercel "Environment Variables" in
// production). Never log it, never send it to the browser.
//
// When either var is missing, the whole Trend Manager degrades gracefully to a
// read-only "not configured" state — it never throws on a normal page render.

export interface SupabaseConfig {
  url: string
  serviceRoleKey: string
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) return null
  // Trim any trailing slash so we can safely append `/rest/v1/...`.
  return { url: url.replace(/\/+$/, ''), serviceRoleKey }
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null
}
