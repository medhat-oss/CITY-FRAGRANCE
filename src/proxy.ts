import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_COOKIE = 'admin_session';
const CASHIER_COOKIE = 'cashier_session';

/** Paths that should always be accessible without auth */
const PUBLIC_PATHS = new Set([
  '/admin/login',
  '/cashier/login',
]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths through without any cookie check
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const adminCookie = request.cookies.get(ADMIN_COOKIE);
  const cashierCookie = request.cookies.get(CASHIER_COOKIE);

  // For admin routes: allow if either cookie exists (admin session preferred, but
  // cashier session is also acceptable — the client-side /api/auth/me will resolve
  // the correct identity). Only block when no session cookie exists at all.
  if (pathname.startsWith('/admin')) {
    if (!adminCookie && !cashierCookie) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    return NextResponse.next();
  }

  // For cashier routes: same lenient check
  if (pathname.startsWith('/cashier')) {
    if (!adminCookie && !cashierCookie) {
      return NextResponse.redirect(new URL('/cashier/login', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/cashier/:path*'],
};
