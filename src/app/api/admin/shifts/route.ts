import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readJsonFile } from '@/lib/dataFile';
import { verifySession, verifySessionForPOS } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const shiftSelect = {
  id: true, cashierId: true, cashierName: true,
  startTime: true, endTime: true, status: true,
  totalCash: true, totalInstaPay: true, totalVodafoneCash: true,
  totalVisa: true, actualCash: true, expectedTotal: true,
  discrepancy: true, orderCount: true,
} as const;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const cashierIdParam = searchParams.get('cashierId');

    // When fetching the active OPEN shift (cashier POS), use POS-aware session
    // so a cashier_session always wins over admin_session.
    const session = statusFilter === 'OPEN'
      ? await verifySessionForPOS(cashierIdParam || undefined)
      : await verifySession();

    if (!session) {
      console.error('[SHIFTS API] GET 401: verifySession returned null — check admin_session/cashier_session cookies');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const targetCashierId = cashierIdParam || session.id;

    if (statusFilter === 'OPEN') {
      const shift = await prisma.shift.findFirst({
        where: { cashierId: targetCashierId, status: 'OPEN' },
        select: shiftSelect,
      });

      if (!shift) {
        return NextResponse.json({ shift: null });
      }

      // Aggregate actual total sums using Prisma _sum
      const cashAgg = await prisma.order.aggregate({
        _sum: { totalPrice: true },
        where: { shiftId: shift.id, paymentMethod: 'cash', status: { not: 'Cancelled' } }
      });
      const instapayAgg = await prisma.order.aggregate({
        _sum: { totalPrice: true },
        where: { shiftId: shift.id, paymentMethod: 'instapay', status: { not: 'Cancelled' } }
      });
      const vodafoneAgg = await prisma.order.aggregate({
        _sum: { totalPrice: true },
        where: { shiftId: shift.id, paymentMethod: 'vodafone', status: { not: 'Cancelled' } }
      });
      const visaAgg = await prisma.order.aggregate({
        _sum: { totalPrice: true },
        where: { shiftId: shift.id, paymentMethod: 'visa', status: { not: 'Cancelled' } }
      });

      const totalCash = cashAgg._sum.totalPrice || 0;
      const totalInstaPay = instapayAgg._sum.totalPrice || 0;
      const totalVodafoneCash = vodafoneAgg._sum.totalPrice || 0;
      const totalVisa = visaAgg._sum.totalPrice || 0;
      const expectedTotal = totalCash + totalInstaPay + totalVodafoneCash + totalVisa;

      const orderCount = await prisma.order.count({
        where: { shiftId: shift.id, status: { not: 'Cancelled' } }
      });

      return NextResponse.json({
        shift: { ...shift, totalCash, totalInstaPay, totalVodafoneCash, totalVisa, expectedTotal, orderCount },
      });
    }

    if (session.role === 'ADMIN') {
      const shifts = await prisma.shift.findMany({
        where: { status: 'CLOSED' },
        orderBy: { endTime: 'desc' },
        select: shiftSelect,
      });
      return NextResponse.json({ shifts });
    }

    const shifts = await prisma.shift.findMany({
      where: { cashierId: targetCashierId, status: 'CLOSED' },
      orderBy: { endTime: 'desc' },
      select: shiftSelect,
    });
    return NextResponse.json({ shifts });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to fetch shifts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action: string;
      actualCash?: number;
      shiftPassword?: string;
      cashierId?: string;
      userId?: string;
    };

    // All shift operations (open, verify-password, close) are cashier POS actions.
    // Use POS-aware session so cashier_session always wins over admin_session.
    const session = await verifySessionForPOS(body.userId || body.cashierId);
    if (!session) {
      console.error('[SHIFTS API] POST 401: verifySessionForPOS returned null');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const targetCashierId = body.userId || body.cashierId || session.id;

    if (body.action === 'open') {
      // strict active shift check
      const existingShift = await prisma.shift.findFirst({
        where: { cashierId: targetCashierId, status: { in: ['OPEN', 'ACTIVE'] } },
        select: { id: true },
      });
      if (existingShift) {
        return NextResponse.json({
          success: false,
          error: 'Active shift already exists for this cashier'
        }, { status: 400 });
      }

      // Find username from admin-users.json file using targetCashierId
      const fileData = await readJsonFile<{ users: { id: string; email: string; username: string; shiftPassword?: string }[] }>('admin-users.json', { users: [] });
      const cashier = fileData.users.find((u) => u.id === targetCashierId);
      const cashierName = cashier?.username || session.username || 'Cashier';

      const newShift = await prisma.shift.create({
        data: {
          cashierId: targetCashierId,
          cashierName: cashierName,
          startTime: new Date(),
          status: 'OPEN',
        },
      });
      return NextResponse.json({ success: true, shift: newShift });
    }

    if (body.action === 'verify-password') {
      if (!body.shiftPassword) {
        return NextResponse.json({ error: 'Shift password is required' }, { status: 400 });
      }
      const fileData = await readJsonFile<{ users: { id: string; email: string; username: string; shiftPassword?: string }[] }>('admin-users.json', { users: [] });
      const cashier = fileData.users.find((u) => u.id === targetCashierId);
      if (!cashier) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      const expectedPassword = cashier.shiftPassword || '123456';
      if (expectedPassword !== body.shiftPassword) {
        return NextResponse.json({ error: 'Incorrect shift password' }, { status: 401 });
      }
      return NextResponse.json({ success: true });
    }

    if (body.action !== 'close') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (!body.shiftPassword) {
      return NextResponse.json({ error: 'Shift password is required' }, { status: 400 });
    }

    const fileData = await readJsonFile<{ users: { id: string; email: string; username: string; shiftPassword?: string }[] }>('admin-users.json', { users: [] });
    const cashier = fileData.users.find((u) => u.id === targetCashierId);
    if (!cashier) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const expectedPassword = cashier.shiftPassword || '123456';
    if (expectedPassword !== body.shiftPassword) {
      return NextResponse.json({ error: 'Incorrect shift password' }, { status: 401 });
    }

    // ── Atomic shift close inside a transaction ──
    const result = await prisma.$transaction(async (tx) => {
      const activeShift = await tx.shift.findFirst({
        where: { cashierId: targetCashierId, status: 'OPEN' },
        select: { id: true, startTime: true, cashierName: true },
      });

      if (!activeShift) {
        throw new Error('No active shift found');
      }

      // Aggregate using _sum
      const cashAgg = await tx.order.aggregate({
        _sum: { totalPrice: true },
        where: { shiftId: activeShift.id, paymentMethod: 'cash', status: { not: 'Cancelled' } }
      });
      const instapayAgg = await tx.order.aggregate({
        _sum: { totalPrice: true },
        where: { shiftId: activeShift.id, paymentMethod: 'instapay', status: { not: 'Cancelled' } }
      });
      const vodafoneAgg = await tx.order.aggregate({
        _sum: { totalPrice: true },
        where: { shiftId: activeShift.id, paymentMethod: 'vodafone', status: { not: 'Cancelled' } }
      });
      const visaAgg = await tx.order.aggregate({
        _sum: { totalPrice: true },
        where: { shiftId: activeShift.id, paymentMethod: 'visa', status: { not: 'Cancelled' } }
      });

      const totalCash = cashAgg._sum.totalPrice || 0;
      const totalInstaPay = instapayAgg._sum.totalPrice || 0;
      const totalVodafoneCash = vodafoneAgg._sum.totalPrice || 0;
      const totalVisa = visaAgg._sum.totalPrice || 0;
      const expectedTotal = totalCash + totalInstaPay + totalVodafoneCash + totalVisa;
      const actualCashValue = body.actualCash ?? 0;
      const discrepancy = actualCashValue - expectedTotal;

      const orderCount = await tx.order.count({
        where: { shiftId: activeShift.id, status: { not: 'Cancelled' } }
      });

      await tx.shift.update({
        where: { id: activeShift.id },
        data: {
          status: 'CLOSED',
          endTime: new Date(),
          totalCash,
          totalInstaPay,
          totalVodafoneCash,
          totalVisa,
          actualCash: actualCashValue,
          expectedTotal,
          discrepancy,
          orderCount,
        },
      });

      // Record in ShiftLog (non-blocking)
      if (typeof prisma.shiftLog !== 'undefined' && prisma.shiftLog !== null) {
        try {
          await prisma.shiftLog.create({
            data: {
              userId: targetCashierId,
              userName: cashier.username || activeShift.cashierName || 'Cashier',
              shiftId: activeShift.id,
              shiftStartedAt: activeShift.startTime,
              shiftEndedAt: new Date(),
              ordersCount: orderCount,
              cashExpected: totalCash,
              instapayExpected: totalInstaPay,
              vodafoneCashExpected: totalVodafoneCash,
              visaExpected: totalVisa,
              totalExpected: expectedTotal,
              actualCashInDrawer: actualCashValue,
            },
          });
        } catch (logErr) {
          console.error('ShiftLog creation failed (non-blocking):', logErr);
        }
      } else {
        console.warn('prisma.shiftLog is not available — ShiftLog record skipped');
      }

      return {
        orderCount,
        expectedTotal,
        totalCash,
        totalInstaPay,
        totalVodafoneCash,
        totalVisa,
        actualCash: actualCashValue,
        discrepancy,
      };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to close shift';
    console.error('Shift close error:', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
