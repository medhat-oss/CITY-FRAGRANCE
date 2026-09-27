import { NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/password';
import prisma from '@/lib/prisma';
import { createSession, setAdminCookie, CASHIER_COOKIE } from '@/lib/auth';
import { rateLimit, extractIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const ip = extractIp(request);
    const check = rateLimit(`login:${ip}`, 5, 60000);
    if (!check.allowed) {
      return NextResponse.json(
        { error: `Too many login attempts. Try again in ${check.retryAfter} seconds.` },
        { status: 429, headers: { 'Retry-After': String(check.retryAfter) } }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const lowerEmail = email.toLowerCase();
    let user = await prisma.user.findFirst({
      where: { email: lowerEmail },
      select: { id: true, email: true, username: true, name: true, role: true, password: true },
    });
    if (!user) {
      user = await prisma.user.findFirst({
        where: { username: lowerEmail },
        select: { id: true, email: true, username: true, name: true, role: true, password: true },
      });
    }
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const token = await createSession({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, username: user.username, role: user.role },
    });
    response.cookies.set(CASHIER_COOKIE, '', { maxAge: 0, path: '/' });
    setAdminCookie(response, token);

    return response;
  } catch (err) {
    console.error('ADMIN LOGIN ERROR:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
