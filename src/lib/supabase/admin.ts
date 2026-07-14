import { createClient } from './server';

/**
 * Result of a server-side admin authorization check.
 * `ok: true` carries the authenticated admin's user id; otherwise a ready-to-use
 * HTTP status + error message is provided.
 */
export type AdminAuthResult =
  | { ok: true; userId: string }
  | { ok: false; status: number; error: string };

/**
 * Server-side guard: ensure the current request comes from an authenticated
 * admin (a user whose `user_profiles.is_admin` is true).
 *
 * Use at the very top of admin-only route handlers. This is the authoritative
 * check — client-side gates (React redirects, password prompts) are cosmetic
 * and must never be relied on for authorization.
 *
 * @example
 *   const auth = await requireAdmin();
 *   if (!auth.ok) {
 *     return NextResponse.json({ error: auth.error }, { status: auth.status });
 *   }
 */
export async function requireAdmin(): Promise<AdminAuthResult> {
  const supabase = await createClient();

  // If Supabase is not configured we cannot authorize anyone — fail closed.
  if (!supabase) {
    return { ok: false, status: 503, error: 'Authentication service is not configured' };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return { ok: false, status: 403, error: 'Forbidden' };
  }

  return { ok: true, userId: user.id };
}
