// ─── ScamCheck LT — app metadata ─────────────────────────────────────────────
//
// Central place for version labels surfaced in the internal admin panel.
// APP_VERSION is read from package.json so it stays in sync with the package.

import pkg from '@/package.json'

export const APP_VERSION: string = pkg.version

// The structured knowledge base (knowledge/*.ts) is the v0.2 data layer.
export const KNOWLEDGE_BASE_VERSION = 'v0.2'

// This admin viewer ships as v0.3 — read-only "Admin Lite".
export const ADMIN_PANEL_VERSION = 'v0.3 · Admin Lite'
