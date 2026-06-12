// AI GUARDRAIL: This is an admin-only view of a specific cashier's shift history.
// The `userId` query parameter selects which user to view — do NOT replace with session.id.

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await verifySession();
    if (!session?.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Verify admin role directly from DB
    const rows = await prisma.$queryRaw<Array<{ role: string }>>`
      SELECT role::text FROM "User" WHERE id = ${session.id} LIMIT 1
    `;
    if (rows.length === 0 || rows[0].role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId query parameter is required' }, { status: 400 });
    }

    const shifts = await prisma.shift.findMany({
      where: { cashierId: userId },
      orderBy: { startTime: 'desc' },
      select: {
        id: true, cashierId: true, cashierName: true,
        startTime: true, endTime: true, status: true,
        totalCash: true, totalInstaPay: true, totalVodafoneCash: true,
        totalVisa: true, actualCash: true, expectedTotal: true,
        discrepancy: true, orderCount: true,
      },
    });

    return NextResponse.json({ success: true, shifts });
  } catch (err) {
    console.error('[STAFF SHIFTS API]', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to fetch shifts' },
      { status: 500 },
    );
  }
}
