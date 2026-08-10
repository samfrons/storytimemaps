import { createHmac, timingSafeEqual } from 'crypto'
import type { NextRequest } from 'next/server'

/**
 * Password gate for the outreach admin API.
 *
 * The password itself lives ONLY in the server-side environment variable
 * OUTREACH_ADMIN_PASSWORD — never in this repo, never in a NEXT_PUBLIC_* var
 * (those are inlined into the browser bundle and are not secrets).
 *
 * The browser never holds the password after login: it exchanges it once for
 * an httpOnly cookie carrying an HMAC derived from the password, so the value
 * is not readable by client JavaScript and never appears in a URL.
 *
 * Fails CLOSED: if OUTREACH_ADMIN_PASSWORD is unset, every request is denied
 * rather than silently passing through (the failure mode that left these
 * routes open in production).
 */

export const OUTREACH_COOKIE = 'outreach_admin'

// Bumping this label invalidates every existing session cookie.
const SESSION_LABEL = 'outreach-admin-v1'

function getSecret(): string | null {
  const secret = process.env.OUTREACH_ADMIN_PASSWORD
  if (!secret || secret.length === 0) return null
  return secret
}

/** Deterministic session token derived from the password — never the password itself. */
export function sessionToken(secret: string): string {
  return createHmac('sha256', secret).update(SESSION_LABEL).digest('hex')
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  // timingSafeEqual throws on length mismatch, so compare lengths separately.
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

/** True when the submitted password matches the configured one. */
export function passwordMatches(submitted: unknown): boolean {
  const secret = getSecret()
  if (!secret) return false
  if (typeof submitted !== 'string' || submitted.length === 0) return false
  return safeEqual(submitted, secret)
}

/** True when the request carries a valid session cookie. */
export function isAuthorized(request: NextRequest): boolean {
  const secret = getSecret()
  if (!secret) return false
  const cookie = request.cookies.get(OUTREACH_COOKIE)?.value
  if (!cookie) return false
  return safeEqual(cookie, sessionToken(secret))
}

/** True when the gate is configured at all — used to report misconfiguration. */
export function isConfigured(): boolean {
  return getSecret() !== null
}
