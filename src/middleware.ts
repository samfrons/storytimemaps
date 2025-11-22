import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define protected routes that require authentication
const protectedRoutes = ['/profile', '/account']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )

  // If it's a protected route, check for session
  if (isProtectedRoute) {
    // Check if user has a session token (NextAuth uses next-auth.session-token)
    const token = request.cookies.get('next-auth.session-token') ||
                  request.cookies.get('__Secure-next-auth.session-token')

    // If no token, redirect to login
    if (!token) {
      const url = new URL('/auth/login', request.url)
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
