import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await verifySession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const where = userId ? { userId } : {};

    const logs = await prisma.shiftLog.findMany({
      where,
      orderBy: { shiftEndedAt: 'desc' },
    });

    return NextResponse.json({ success: true, logs });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to fetch shift logs' },
      { status: 500 }
    );
  }
}