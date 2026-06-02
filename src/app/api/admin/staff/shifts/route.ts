import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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
