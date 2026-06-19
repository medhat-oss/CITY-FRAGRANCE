import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { createSession, setCashierCookie } from '@/lib/auth';

export const runtime = 'edge';
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email/Username and password are required' }, { status: 400 });
    }

    // Raw query — avoids Prisma client type-mismatch issues
    const users = await prisma.$queryRaw<Array<{
      id: string; email: string; username: string; name: string;
      role: string; password: string;
    }>>`
      SELECT id, email, username, name, role::text, password
      FROM "User"
      WHERE email = ${email} OR username = ${email}
      LIMIT 1
    `;

    const user = users[0];
    if (!user || !user.password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
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

    // Create OPEN shift record on successful login
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
