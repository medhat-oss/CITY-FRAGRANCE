import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

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
    const rows = await prisma.$queryRaw<Array<{ role: string }>>`
      SELECT role::text FROM "User" WHERE id = ${session.id} LIMIT 1
    `;
    if (rows.length === 0 || rows[0].role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { shiftId } = await params;
    if (!shiftId) {
      return NextResponse.json({ success: false, error: 'Shift ID is required' }, { status: 400 });
    }

    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        orders: {
          select: {
            id: true, orderId: true, date: true, customerName: true,
            phoneNumber: true, createdAt: true,
            totalPrice: true, paymentMethod: true, status: true,
            items: true, address: true,
          },
        },
      },
    });

    if (!shift) {
      return NextResponse.json({ success: false, error: 'Shift not found' }, { status: 404 });
    }

    // Ensure every item in every order has a stable `id` field.
    // Items created before the id standard may lack one — inject a deterministic
    // fallback so the per-item cancel button always has a valid orderItemId.
    const ordersWithItemIds = shift.orders.map((o) => ({
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
      shift: {
        id: shift.id,
        cashierId: shift.cashierId,
        cashierName: shift.cashierName,
        startTime: shift.startTime,
        endTime: shift.endTime,
        status: shift.status,
        totalCash: shift.totalCash,
        totalInstaPay: shift.totalInstaPay,
        totalVodafoneCash: shift.totalVodafoneCash,
        totalVisa: shift.totalVisa,
        expectedTotal: shift.expectedTotal,
        orderCount: shift.orderCount,
      },
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
