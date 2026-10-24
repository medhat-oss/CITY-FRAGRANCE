import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { computeShiftTotals } from '@/lib/shiftTotals';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shiftId: string }> },
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const { shiftId } = await params;
    if (!shiftId) {
      return NextResponse.json({ success: false, error: 'Shift ID is required' }, { status: 400 });
    }

    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      select: {
        id: true, cashierId: true, cashierName: true,
        startTime: true, endTime: true, status: true,
        totalCash: true, totalInstaPay: true, totalVodafoneCash: true,
        totalVisa: true, expectedTotal: true, orderCount: true,
      },
    });

    if (!shift) {
      return NextResponse.json({ success: false, error: 'Shift not found' }, { status: 404 });
    }

    // OPEN shifts store no totals (they are only written at close time) —
    // aggregate live from the shift's orders so the totals header and the
    // payment-method breakdown reflect the running shift.
    const shiftWithLiveTotals =
      shift.status === 'OPEN'
        ? { ...shift, ...(await computeShiftTotals(shift.id)) }
        : shift;

    const orders = await prisma.order.findMany({
      where: { shiftId, source: 'POS' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderId: true,
        customerName: true,
        phoneNumber: true,
        items: true,
        totalPrice: true,
        paymentMethod: true,
        createdAt: true,
        status: true,
      },
    });

    return NextResponse.json({ success: true, shift: shiftWithLiveTotals, orders });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to fetch shift orders' },
      { status: 500 }
    );
  }
}
