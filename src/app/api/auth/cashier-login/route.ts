import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { readJsonFile } from '@/lib/dataFile';
import { createSession, setCashierCookie, ADMIN_COOKIE } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface User {
  id: string;
  email: string;
  username: string;
  password?: string;
  role: string;
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email/Username and password are required' }, { status: 400 });
    }

    const fileData = await readJsonFile<{ users: User[] }>('admin-users.json', { users: [] });
    const user = fileData.users.find(
      (u: User) => u.email === email || u.username === email
    );

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
      // Check if there's already an OPEN shift for this cashier
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
      // Non-blocking: shift creation failure should not prevent login
      console.error('SHIFT CREATION ERROR:', shiftErr);
    }

    const response = NextResponse.json({ 
      success: true, 
      user: { id: user.id, email: user.email, username: user.username, role: user.role } 
    });

    // Clear any stale admin_session so verifySession() does not prefer it
    response.cookies.set(ADMIN_COOKIE, '', { maxAge: 0, path: '/' });
    setCashierCookie(response, token);

    return response;
  } catch (err) {
    console.error('CASHIER LOGIN ERROR:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
