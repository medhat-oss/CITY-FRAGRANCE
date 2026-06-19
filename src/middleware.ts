import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_COOKIE = 'admin_session';
const CASHIER_COOKIE = 'cashier_session';

const PUBLIC_PATHS = new Set([
  '/admin/login',
  '/cashier/login',
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();

  const adminCookie = request.cookies.get(ADMIN_COOKIE);
  const cashierCookie = request.cookies.get(CASHIER_COOKIE);

  if (pathname.startsWith('/admin')) {
    if (!adminCookie && !cashierCookie)
      return NextResponse.redirect(new URL('/admin/login', request.url));
    return NextResponse.next();
  }

  if (pathname.startsWith('/cashier')) {
    if (!adminCookie && !cashierCookie)
      return NextResponse.redirect(new URL('/cashier/login', request.url));
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/cashier/:path*'],
};
