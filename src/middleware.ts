import { NextResponse } from 'next/server';

export const runtime = 'edge';

export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
