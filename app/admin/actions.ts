// ─── ScamCheck LT v0.3 — Admin Panel Lite server actions ─────────────────────
//
// Login / logout for the read-only admin viewer. These run on the server only;
// the password is verified against ADMIN_PASSWORD and never returned to the
// client. On success an httpOnly session cookie is set (see lib/adminAuth.ts).

'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  ADMIN_COOKIE,
  adminPasswordConfigured,
  passwordMatches,
  sessionCookie,
} from '@/lib/adminAuth'

export async function loginAction(formData: FormData) {
  if (!adminPasswordConfigured()) {
    redirect('/admin/login?error=config')
  }

  const password = String(formData.get('password') ?? '')
  if (!passwordMatches(password)) {
    redirect('/admin/login?error=invalid')
  }

  const c = sessionCookie()
  cookies().set(c.name, c.value, c.options)
  redirect('/admin')
}

export async function logoutAction() {
  cookies().delete(ADMIN_COOKIE)
  redirect('/admin/login')
}
