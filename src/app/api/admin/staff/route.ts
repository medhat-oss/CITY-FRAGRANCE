// AI GUARDRAIL: DO NOT add session.id or user-specific filters to this global admin fetch.
// Admins must see all database records. Modifying this will break the Admin Panel dashboard layout.

import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/password';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, username: true, name: true, role: true, createdAt: true, updatedAt: true },
    });

    const staff = users.map((u: any) => ({
      ...u,
      role: u.role || 'CASHIER',
      createdAt: u.createdAt,
    }));

    return NextResponse.json({ success: true, staff });
  } catch (err) {
    console.error('STAFF GET ERROR:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const { email, username, password, role, shiftPassword } = await request.json();

    if (!email || !username || !password || !role) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const lowerEmail = email.toLowerCase().trim();
    const lowerUsername = username.toLowerCase().trim();

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: lowerEmail },
          { username: lowerUsername },
        ],
      },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Staff account already exists with this email or username' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const roleEnum = role.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'CASHIER';
    const cleanShiftPassword = typeof shiftPassword === 'string' && shiftPassword.trim().length >= 3
      ? shiftPassword.trim()
      : '123456';

    const newUser = await prisma.user.create({
      data: {
        email: lowerEmail,
        username: lowerUsername,
        password: hashedPassword,
        name: username,
        role: roleEnum,
        shiftPassword: cleanShiftPassword,
      },
      select: { id: true, email: true, username: true, name: true, role: true, createdAt: true },
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (err) {
    console.error('STAFF POST ERROR:', err);
    const errorMessage = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 });
    }

    const staffUser = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true, role: true } });

    if (!staffUser) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    if (staffUser.id === auth.id) {
      return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 });
    }

    if (staffUser.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'Cannot delete the last remaining administrator account.' }, { status: 400 });
      }
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('STAFF DELETE ERROR:', err);
    const errorMessage = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const { id, shiftPassword } = await request.json();
    if (!id || !shiftPassword) {
      return NextResponse.json({ error: 'Staff ID and new shift password are required' }, { status: 400 });
    }

    const trimmedPassword = shiftPassword.trim();
    if (trimmedPassword.length < 3) {
      return NextResponse.json({ error: 'Shift password must be at least 3 characters' }, { status: 400 });
    }

    const staffUser = await prisma.user.findUnique({ where: { id }, select: { id: true } });

    if (!staffUser) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    await prisma.user.update({ where: { id }, data: { shiftPassword: trimmedPassword } });
    return NextResponse.json({ success: true, message: 'Shift password updated successfully' });
  } catch (err) {
    console.error('STAFF PATCH ERROR:', err);
    const errorMessage = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
