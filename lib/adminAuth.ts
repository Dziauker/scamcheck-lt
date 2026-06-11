// ─── ScamCheck LT v0.3 — Admin Panel Lite auth ───────────────────────────────
//
// Minimal, fail-closed, server-only admin gate for the read-only knowledge-base
// viewer. Design goals for this prototype stage:
//
//   - The password lives ONLY in process.env.ADMIN_PASSWORD (server side).
//   - The raw password is never written to the cookie or sent to the client.
//     The session cookie stores sha256(password); each request recomputes the
//     same hash and compares it in constant time.
//   - No password set ⇒ nobody can authenticate (fail closed).
//
// This module imports next/headers and node:crypto, so it can only run in the
// Node.js server runtime — never bundled into client code.

import { cookies } from 'next/headers'
import { createHash, timingSafeEqual } from 'node:crypto'

export const ADMIN_COOKIE = 'scamcheck_admin'

// 8 hours — short enough for a single working session.
const COOKIE_MAX_AGE = 60 * 60 * 8

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

// Constant-time string compare. Returns false on length mismatch; both inputs
// here are fixed-length sha256 hex, so length never leaks the secret.
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

export function adminPasswordConfigured(): boolean {
  const pw = process.env.ADMIN_PASSWORD
  return typeof pw === 'string' && pw.length > 0
}

// Cookie token = sha256(password). Null when no password is configured.
function sessionToken(): string | null {
  const pw = process.env.ADMIN_PASSWORD
  if (!pw) return null
  return sha256(pw)
}

// Checks a submitted login password against ADMIN_PASSWORD in constant time.
export function passwordMatches(input: string): boolean {
  const pw = process.env.ADMIN_PASSWORD
  if (!pw) return false
  return safeEqual(sha256(input), sha256(pw))
}

// Cookie descriptor for a freshly authenticated session. `secure` is only set
// in production so the cookie still works over http://localhost in dev.
export function sessionCookie() {
  const value = sessionToken()
  if (!value) throw new Error('ADMIN_PASSWORD is not configured')
  return {
    name: ADMIN_COOKIE,
    value,
    options: {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    },
  }
}

// True when the current request carries a valid admin session cookie.
export function isAdminAuthenticated(): boolean {
  const expected = sessionToken()
  if (!expected) return false
  const token = cookies().get(ADMIN_COOKIE)?.value
  if (!token) return false
  return safeEqual(token, expected)
}
