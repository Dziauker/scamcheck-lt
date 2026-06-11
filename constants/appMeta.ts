// ─── ScamCheck LT — app metadata ─────────────────────────────────────────────
//
// Central place for version labels surfaced in the internal admin panel.
// APP_VERSION is read from package.json so it stays in sync with the package.

import pkg from '@/package.json'

export const APP_VERSION: string = pkg.version

// Public-facing version chip ("v0.3 demo"). Major.minor only — patch-level
// detail belongs in the admin panel, not the public UI.
export const PUBLIC_VERSION_LABEL = `v${APP_VERSION.split('.').slice(0, 2).join('.')} demo`

// The structured knowledge base (knowledge/*.ts) is the v0.2 data layer.
export const KNOWLEDGE_BASE_VERSION = 'v0.2'

// This admin viewer ships as v0.3.x — read-only "Admin Lite".
export const ADMIN_PANEL_VERSION = 'v0.3.1 · Admin Lite'
