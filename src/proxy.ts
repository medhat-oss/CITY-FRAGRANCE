import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'city-fragrance-dev-secret-key-change-in-production'
);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Admin Page protection (excl. login, api routes)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = request.cookies.get('admin_session')?.value;
    if (!token) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    try {
      const { payload } = await jwtVerify(token, SECRET);
      const role = (payload as { role?: string }).role;
      if (role !== 'ADMIN') {
        const loginUrl = new URL('/admin/login', request.url);
        return NextResponse.redirect(loginUrl);
      }
    } catch {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Cashier Page protection (excl. login, api routes)
  if (pathname.startsWith('/cashier') && pathname !== '/cashier/login') {
    const token = request.cookies.get('cashier_session')?.value;
    if (!token) {
      const loginUrl = new URL('/cashier/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
    try {
      const { payload } = await jwtVerify(token, SECRET);
      const role = (payload as { role?: string }).role;
      if (role !== 'CASHIER' && role !== 'ADMIN') {
        const loginUrl = new URL('/cashier/login', request.url);
        return NextResponse.redirect(loginUrl);
      }
    } catch {
      const loginUrl = new URL('/cashier/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/cashier/:path*'],
};
