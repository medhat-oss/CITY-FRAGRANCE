import { NextResponse } from 'next/server';
import { verifySession, verifySessionForPOS } from '@/lib/auth';

export const runtime = 'edge';
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get('role');

    const session = roleFilter === 'CASHIER'
      ? await verifySessionForPOS()
      : await verifySession();

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({
      user: {
        id: session.id,
        email: session.email,
        username: session.username,
        role: session.role,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
