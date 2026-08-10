import { NextRequest, NextResponse } from 'next/server'
import {
  OUTREACH_COOKIE,
  isAuthorized,
  isConfigured,
  passwordMatches,
  sessionToken,
} from '@/lib/outreachAuth'

export const dynamic = 'force-dynamic'

/** Session check — lets the admin page restore a session without holding the password. */
export async function GET(request: NextRequest) {
  return NextResponse.json({ authenticated: isAuthorized(request) })
}

/** Exchange the password for an httpOnly session cookie. */
export async function POST(request: NextRequest) {
  if (!isConfigured()) {
    console.error('OUTREACH_ADMIN_PASSWORD is not set — refusing outreach admin login')
    return NextResponse.json(
      { success: false, error: 'Admin access is not configured on this server' },
      { status: 503 }
    )
  }

  let password: unknown
  try {
    const body = await request.json()
    password = body?.password
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
  }

  if (!passwordMatches(password)) {
    return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set(
    OUTREACH_COOKIE,
    sessionToken(process.env.OUTREACH_ADMIN_PASSWORD as string),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours
    }
  )
  return response
}

/** Log out — clear the session cookie. */
export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.set(OUTREACH_COOKIE, '', { path: '/', maxAge: 0 })
  return response
}
