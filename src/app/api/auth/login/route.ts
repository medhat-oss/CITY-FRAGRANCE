import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { createSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const dataPath = path.join(process.cwd(), 'data', 'admin-users.json');
    const fileData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    const user = fileData.users.find(
      (u: { email: string; username: string }) => u.email === email || u.username === email
    );

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
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

    const response = NextResponse.json({ success: true, user: { id: user.id, email: user.email, username: user.username, role: user.role } });
    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
