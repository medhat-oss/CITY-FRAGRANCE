import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'city-fragrance-dev-secret-key-change-in-production'
);
const protectedPrefix = '/admin';
const loginPath = '/admin/login';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith(protectedPrefix)) {
    return NextResponse.next();
  }

  if (pathname === loginPath) {
    return NextResponse.next();
  }

  const token = request.cookies.get('admin_session')?.value;

  if (!token) {
    const loginUrl = new URL(loginPath, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(
      token,
      SECRET
    );
    const role = (payload as { role?: string }).role;

    if (role !== 'ADMIN') {
      const loginUrl = new URL(loginPath, request.url);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  } catch {
    const loginUrl = new URL(loginPath, request.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};
