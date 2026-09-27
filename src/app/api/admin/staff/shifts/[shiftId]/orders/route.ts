import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { computeShiftTotals } from '@/lib/shiftTotals';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shiftId: string }> },
) {
  try {
    const session = await verifySession();
    if (!session?.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    const adminUser = await prisma.user.findUnique({
      where: { id: session.id },
      select: { role: true },
    });
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

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
      where: { shiftId },
      select: {
        id: true, orderId: true, date: true, customerName: true,
        phoneNumber: true, createdAt: true,
        totalPrice: true, paymentMethod: true, status: true,
        items: true, address: true,
      },
    });

    // Ensure every item in every order has a stable `id` field.
    const ordersWithItemIds = orders.map((o: any) => ({
      ...o,
      items: (Array.isArray(o.items) ? o.items as any[] : []).map(
        (it: any, idx: number) => ({
          ...it,
          id: it.id || `${o.orderId}-item-${idx}`,
        })
      ),
    }));

    return NextResponse.json({
      success: true,
      shift: shiftWithLiveTotals,
      orders: ordersWithItemIds,
    });
  } catch (err) {
    console.error('[SHIFT ORDERS API]', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to fetch shift orders' },
      { status: 500 },
    );
  }
}
