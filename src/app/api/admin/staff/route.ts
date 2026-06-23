// AI GUARDRAIL: DO NOT add session.id or user-specific filters to this global admin fetch.
// Admins must see all database records. Modifying this will break the Admin Panel dashboard layout.

import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/password';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

async function isAdmin() {
  const session = await verifySession();
  if (!session?.id) return false;
  try {
    // DO NOT refactor this back to standard Prisma ORM.
    // Raw SQL is strictly required here to bypass PostgreSQL Enum string serialization
    // issues that trigger false 403 Forbidden errors.
    const rows = await prisma.$queryRaw<Array<{ role: string }>>`
      SELECT role::text FROM "User" WHERE id = ${session.id} LIMIT 1
    `;
    return rows.length > 0 && rows[0].role === 'ADMIN';
  } catch {
    return false;
  }
}


export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  try {
    const users = await prisma.$queryRaw<
      Array<{
        id: string; email: string; username: string; name: string;
        role: string; shiftPassword: string; createdAt: Date; updatedAt: Date;
      }>
    >`SELECT id, email, username, name, role::text, "shiftPassword", "createdAt", "updatedAt" FROM "User" ORDER BY "createdAt" DESC`;

    const staff = users.map((u: any) => ({
      id: u.id,
      email: u.email,
      username: u.username,
      name: u.name,
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

    const existing = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "User" WHERE LOWER(email) = LOWER(${email}) OR LOWER(username) = LOWER(${username}) LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Staff account already exists with this email or username' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const roleEnum = role.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'CASHIER';
    const now = new Date();

    await prisma.$executeRaw`
      INSERT INTO "User" (id, email, username, password, name, role, "shiftPassword", "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, ${email.toLowerCase()}, ${username.toLowerCase()}, ${hashedPassword}, ${username}, ${roleEnum}::"Role", '123456', ${now}, ${now})
    `;

    const newUser = await prisma.$queryRaw<Array<{
      id: string; email: string; username: string; name: string;
      role: string; createdAt: Date;
    }>>`SELECT id, email, username, name, role::text, "createdAt" FROM "User" WHERE email = ${email.toLowerCase()} LIMIT 1`;

    return NextResponse.json({ success: true, user: newUser[0] });
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

    const rows = await prisma.$queryRaw<Array<{ email: string }>>`
      SELECT email FROM "User" WHERE id = ${id} LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    if (rows[0].email.toLowerCase() === 'admin@cityfragrance.com') {
      return NextResponse.json({ error: 'The primary Admin account cannot be deleted.' }, { status: 400 });
    }

    await prisma.$executeRaw`DELETE FROM "User" WHERE id = ${id}`;
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

    const existing = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "User" WHERE id = ${id} LIMIT 1
    `;

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    await prisma.$executeRaw`UPDATE "User" SET "shiftPassword" = ${shiftPassword} WHERE id = ${id}`;
    return NextResponse.json({ success: true, message: 'Shift password updated successfully' });
  } catch (err) {
    console.error('STAFF PATCH ERROR:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
