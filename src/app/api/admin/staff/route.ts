// AI GUARDRAIL: DO NOT add session.id or user-specific filters to this global admin fetch.
// Admins must see all database records. Modifying this will break the Admin Panel dashboard layout.

import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/password';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function isAdmin() {
  const session = await verifySession();
  if (!session?.id) return false;
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { role: true },
    });
    return user?.role === 'ADMIN';
  } catch {
    return false;
  }
}


export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, username: true, name: true, role: true, shiftPassword: true, createdAt: true, updatedAt: true },
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
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  try {
    const { email, username, password, role } = await request.json();

    if (!email || !username || !password || !role) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    let existingUser = await prisma.user.findFirst({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });
    if (!existingUser) {
      existingUser = await prisma.user.findFirst({
        where: { username: username.toLowerCase() },
        select: { id: true },
      });
    }

    if (existingUser) {
      return NextResponse.json({ error: 'Staff account already exists with this email or username' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const roleEnum = role.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'CASHIER';

    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        password: hashedPassword,
        name: username,
        role: roleEnum,
        shiftPassword: '123456',
      },
      select: { id: true, email: true, username: true, name: true, role: true, createdAt: true },
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (err) {
    console.error('STAFF POST ERROR:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 });
    }

    const staffUser = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true } });

    if (!staffUser) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    if (staffUser.email.toLowerCase() === 'admin@cityfragrance.com') {
      return NextResponse.json({ error: 'The primary Admin account cannot be deleted.' }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('STAFF DELETE ERROR:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  try {
    const { id, shiftPassword } = await request.json();
    if (!id || !shiftPassword) {
      return NextResponse.json({ error: 'Staff ID and new shift password are required' }, { status: 400 });
    }

    if (shiftPassword.length < 3) {
      return NextResponse.json({ error: 'Shift password must be at least 3 characters' }, { status: 400 });
    }

    const staffUser = await prisma.user.findUnique({ where: { id }, select: { id: true } });

    if (!staffUser) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    await prisma.user.update({ where: { id }, data: { shiftPassword } });
    return NextResponse.json({ success: true, message: 'Shift password updated successfully' });
  } catch (err) {
    console.error('STAFF PATCH ERROR:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
