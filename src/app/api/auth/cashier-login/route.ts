import { NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/password';
import prisma from '@/lib/prisma';
import { createSession, setCashierCookie } from '@/lib/auth';
import { rateLimit, extractIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const ip = extractIp(request);
    const check = rateLimit(`cashier-login:${ip}`, 5, 60000);
    if (!check.allowed) {
      return NextResponse.json(
        { error: `Too many login attempts. Try again in ${check.retryAfter} seconds.` },
        { status: 429, headers: { 'Retry-After': String(check.retryAfter) } }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email/Username and password are required' }, { status: 400 });
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
    if (!user || !user.password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.role !== 'CASHIER' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied. Authorized staff only.' }, { status: 403 });
    }

    const token = await createSession({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    try {
      const existingShift = await prisma.shift.findFirst({
        where: { cashierId: user.id, status: 'OPEN' },
      });

      if (!existingShift) {
        await prisma.shift.create({
          data: {
            cashierId: user.id,
            cashierName: user.username,
            startTime: new Date(),
            status: 'OPEN',
          },
        });
      }
    } catch (shiftErr) {
      console.error('SHIFT CREATION ERROR:', shiftErr);
    }

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, username: user.username, role: user.role },
    });

    setCashierCookie(response, token);

    return response;
  } catch (err) {
    console.error('CASHIER LOGIN ERROR:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
