// AI GUARDRAIL: This is an admin-only view of a specific cashier's shift history.
// The `userId` query parameter selects which user to view — do NOT replace with session.id.

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { computeShiftTotals } from '@/lib/shiftTotals';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
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

    // OPEN shifts store no totals (they are only written at close time) —
    // aggregate live from their orders so the admin history shows a running
    // expected total without requiring the shift to be closed first.
    const shiftsWithLiveTotals = await Promise.all(
      shifts.map(async (shift: any) => {
        if (shift.status !== 'OPEN') return shift;
        const totals = await computeShiftTotals(shift.id);
        return {
          ...shift,
          totalCash: totals.totalCash,
          totalInstaPay: totals.totalInstaPay,
          totalVodafoneCash: totals.totalVodafoneCash,
          totalVisa: totals.totalVisa,
          expectedTotal: totals.expectedTotal,
          orderCount: totals.orderCount,
        };
      })
    );

    return NextResponse.json({ success: true, shifts: shiftsWithLiveTotals });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to fetch shifts' },
      { status: 500 }
    );
  }
}
