// File: src/app/api/plaque-inquiry/route.ts
//
// Public POST endpoint for the per-listing plaque CTA form.
// Anonymous visitors (no auth required) submit a form with their contact
// info; this route validates a honeypot, applies a simple in-memory rate
// limit per IP, then uses the Supabase SERVICE ROLE key to insert a row
// into the existing `proposals` table with proposal_type='plaque_inquiry'.
// Admins review submissions in the existing /admin/proposals UI.
//
// Migration 002_plaque_inquiries.sql adds the enum value, contact
// columns, and drops NOT NULL on user_id (NULL = anonymous).

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { CreatePlaqueInquiryInput, BuildingRole } from '@/lib/types/proposal'

// Required by the project deployment rules: without this Next can statically optimise
// the route at build time and serve a stale snapshot. That is wrong for every route
// here - they read mutable data, and the auth-scoped ones would leak one user's view
// to everyone.
export const dynamic = 'force-dynamic'

const VALID_ROLES: BuildingRole[] = ['owner', 'tenant', 'manager', 'other']
const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute
const RATE_LIMIT_MAX = 5 // 5 submits per IP per minute

// In-memory rate limiter — resets on cold start, but adequate for a
// low-volume form. Replace with Upstash if abuse becomes a problem.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const getClientIp = (request: NextRequest): string => {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const real = request.headers.get('x-real-ip')
  if (real) return real
  return 'unknown'
}

const checkRateLimit = (ip: string): boolean => {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count += 1
  return true
}

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Plaque inquiry service is not configured' }, { status: 503 })
  }

  const ip = getClientIp(request)
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again in a minute.' },
      { status: 429 }
    )
  }

  let body: CreatePlaqueInquiryInput
  try {
    body = (await request.json()) as CreatePlaqueInquiryInput
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Honeypot — bots auto-fill every input including the hidden one.
  // Real users leave it empty. Reject silently with a 400.
  if (body.website && body.website.trim().length > 0) {
    return NextResponse.json({ error: 'Invalid submission' }, { status: 400 })
  }

  // Required-field validation
  if (
    !body.business_id ||
    !body.business_name ||
    !body.business_address ||
    typeof body.business_lat !== 'number' ||
    typeof body.business_lng !== 'number' ||
    !body.inquiry_name ||
    !body.inquiry_email ||
    !body.building_role
  ) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!isValidEmail(body.inquiry_email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  if (!VALID_ROLES.includes(body.building_role)) {
    return NextResponse.json({ error: 'Invalid building role' }, { status: 400 })
  }

  // Length caps — the columns are TEXT but we still bound payload size
  // to make admin review manageable and prevent obvious abuse.
  if (
    body.inquiry_name.length > 200 ||
    body.inquiry_email.length > 320 ||
    (body.inquiry_phone && body.inquiry_phone.length > 50) ||
    (body.message && body.message.length > 2000)
  ) {
    return NextResponse.json({ error: 'Submission too large' }, { status: 400 })
  }

  // Service-role client bypasses RLS — only use server-side, never expose
  // SUPABASE_SERVICE_ROLE_KEY to the browser.
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { error } = await admin.from('proposals').insert({
    user_id: null, // Anonymous submission — schema allows NULL after migration 002
    proposal_type: 'plaque_inquiry',
    original_business_id: body.business_id,
    title: body.business_name,
    address: body.business_address,
    lat: body.business_lat,
    lng: body.business_lng,
    inquiry_name: body.inquiry_name.trim(),
    inquiry_email: body.inquiry_email.trim().toLowerCase(),
    inquiry_phone: body.inquiry_phone?.trim() || null,
    building_role: body.building_role,
    notes: body.message?.trim() || null,
    status: 'pending',
  })

  if (error) {
    console.error('Error inserting plaque inquiry:', error)
    return NextResponse.json(
      { error: 'Failed to submit inquiry. Please try again.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
