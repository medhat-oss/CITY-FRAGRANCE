import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { readJsonFile, writeJsonFile } from '@/lib/dataFile';
import { verifySession } from '@/lib/auth';

interface User {
  id: string;
  email: string;
  username: string;
  password?: string;
  role: string;
  createdAt?: string;
  shiftPassword?: string;
}

// Helper to check if current request has Admin permission
async function checkAdminSession() {
  const session = await verifySession();
  return session && session.role === 'ADMIN';
}

export async function GET() {
  try {
    if (!await checkAdminSession()) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const fileData = await readJsonFile<{ users: User[] }>('admin-users.json', { users: [] });
    // Strip passwords before returning
    const safeUsers = fileData.users.map((u) => ({
      id: u.id,
      email: u.email,
      username: u.username,
      role: u.role,
      createdAt: u.createdAt || new Date().toISOString(),
    }));

    return NextResponse.json({ success: true, staff: safeUsers });
  } catch (err) {
    console.error('STAFF GET ERROR:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!await checkAdminSession()) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { email, username, password, role } = await request.json();

    if (!email || !username || !password || !role) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const fileData = await readJsonFile<{ users: User[] }>('admin-users.json', { users: [] });
    
    // Check if user already exists
    const exists = fileData.users.some(
      (u) => u.email.toLowerCase() === email.toLowerCase() || u.username.toLowerCase() === username.toLowerCase()
    );

    if (exists) {
      return NextResponse.json({ error: 'Staff account already exists with this email or username' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser: User = {
      id: 'staff_' + Date.now(),
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password: hashedPassword,
      role: role.toUpperCase(), // 'ADMIN' or 'CASHIER'
      createdAt: new Date().toISOString(),
      shiftPassword: '123456',
    };

    fileData.users.push(newUser);
    await writeJsonFile('admin-users.json', fileData);

    return NextResponse.json({ 
      success: true, 
      user: { id: newUser.id, email: newUser.email, username: newUser.username, role: newUser.role, createdAt: newUser.createdAt } 
    });
  } catch (err) {
    console.error('STAFF POST ERROR:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!await checkAdminSession()) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 });
    }

    const fileData = await readJsonFile<{ users: User[] }>('admin-users.json', { users: [] });
    
    // Find the user
    const userToDelete = fileData.users.find((u) => u.id === id);
    if (!userToDelete) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Protect the primary admin
    if (userToDelete.email.toLowerCase() === 'admin@cityfragrance.com') {
      return NextResponse.json({ error: 'The primary Admin account cannot be deleted.' }, { status: 400 });
    }

    // Filter out the user
    fileData.users = fileData.users.filter((u) => u.id !== id);
    await writeJsonFile('admin-users.json', fileData);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('STAFF DELETE ERROR:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!await checkAdminSession()) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id, shiftPassword } = await request.json();

    if (!id || !shiftPassword) {
      return NextResponse.json({ error: 'Staff ID and new shift password are required' }, { status: 400 });
    }

    if (shiftPassword.length < 3) {
      return NextResponse.json({ error: 'Shift password must be at least 3 characters' }, { status: 400 });
    }

    const fileData = await readJsonFile<{ users: User[] }>('admin-users.json', { users: [] });
    const userIdx = fileData.users.findIndex((u) => u.id === id);

    if (userIdx === -1) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    fileData.users[userIdx].shiftPassword = shiftPassword;
    await writeJsonFile('admin-users.json', fileData);

    return NextResponse.json({ success: true, message: 'Shift password updated successfully' });
  } catch (err) {
    console.error('STAFF PATCH ERROR:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
