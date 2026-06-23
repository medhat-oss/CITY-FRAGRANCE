import { NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/password';
import prisma from '@/lib/prisma';
import { createSession, setAdminCookie, CASHIER_COOKIE } from '@/lib/auth';


export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
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
