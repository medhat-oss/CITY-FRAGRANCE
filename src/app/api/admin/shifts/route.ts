// AI GUARDRAIL: MULTI-ACCOUNT ISOLATION — Always filter and create records using strictly
// `session.id` to prevent concurrent cashier sessions from cross-contaminating data.
// Admin management paths (e.g., viewing all closed shifts) must remain UNFILTERED by session.

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession, verifySessionForPOS } from '@/lib/auth';

export const runtime = 'edge';
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

    // When fetching the active OPEN shift (cashier POS), use POS-aware session
    // so a cashier_session always wins over admin_session.
    const session = statusFilter === 'OPEN'
      ? await verifySessionForPOS()
      : await verifySession();

    if (!session) {
      console.error('[SHIFTS API] GET 401: verifySession returned null — check admin_session/cashier_session cookies');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // ALWAYS use the session's own ID — never trust client-provided cashierId (multi-account isolation)
    const targetCashierId = session.id;

    if (statusFilter === 'OPEN') {
      const shift = await prisma.shift.findFirst({
        where: { cashierId: targetCashierId, status: 'OPEN' },
        select: shiftSelect,
      });

      if (!shift) {
        return NextResponse.json({ shift: null });
      }

      // Aggregate all payment methods in a single groupBy query
      const cancelledFilter = { notIn: ['Cancelled', 'CANCELLED', 'cancelled'] };
      const agg = await prisma.order.groupBy({
        by: ['paymentMethod'],
        _sum: { totalPrice: true },
        _count: true,
        where: { shiftId: shift.id, status: cancelledFilter },
      });

      let totalCash = 0, totalInstaPay = 0, totalVodafoneCash = 0, totalVisa = 0;
      let orderCount = 0;
      for (const row of agg) {
        const method = (row.paymentMethod || '').toLowerCase();
        const sum = row._sum.totalPrice || 0;
        if (method.includes('cash')) totalCash = sum;
        else if (method.includes('instapay')) totalInstaPay = sum;
        else if (method.includes('vodafone')) totalVodafoneCash = sum;
        else if (method.includes('visa')) totalVisa = sum;
        orderCount += row._count;
      }
      const expectedTotal = totalCash + totalInstaPay + totalVodafoneCash + totalVisa;

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
    };

    // ── FAIL-FAST: Validate action BEFORE any session/DB work ──────────────
    // This ensures malformed requests are rejected in <1ms without touching
    // the database or verifying the session cookie.
    const VALID_ACTIONS = ['open', 'verify-password', 'close'] as const;
    if (!body.action || !VALID_ACTIONS.includes(body.action as typeof VALID_ACTIONS[number])) {
      return NextResponse.json(
        { success: false, error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}` },
        { status: 400 }
      );
    }

    // For 'close' and 'verify-password', shiftPassword is required — validate early.
    if ((body.action === 'close' || body.action === 'verify-password') && !body.shiftPassword) {
      return NextResponse.json(
        { success: false, error: 'Shift password is required' },
        { status: 400 }
      );
    }

    // All shift operations (open, verify-password, close) are cashier POS actions.
    // Use POS-aware session so cashier_session always wins over admin_session.
    // ALWAYS use session.id for isolation — never trust client-provided IDs.
    const session = await verifySessionForPOS();
    if (!session) {
      console.error('[SHIFTS API] POST 401: verifySessionForPOS returned null');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const targetCashierId = session.id;

    if (body.action === 'open') {
      // strict active shift check
      const existingShift = await prisma.shift.findFirst({
        where: { cashierId: targetCashierId, status: { in: ['OPEN', 'ACTIVE'] } },
        select: { id: true },
      });
      if (existingShift) {
        // 400 + SHIFT_ALREADY_OPEN is *expected* — the cashier client treats this
        // as a success (shift is already running). Using a distinct code avoids
        // fragile string-matching on the error message.
        return NextResponse.json({
          success: false,
          code: 'SHIFT_ALREADY_OPEN',
          error: 'Active shift already exists for this cashier',
        }, { status: 400 });
      }

      // Find username from database
      const cashierUser = await prisma.user.findUnique({ where: { id: targetCashierId }, select: { username: true } });
      const cashierName = cashierUser?.username || session.username || 'Cashier';

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
      // shiftPassword already validated above (fail-fast)
      const cashier = await prisma.user.findUnique({ where: { id: targetCashierId }, select: { shiftPassword: true } });
      if (!cashier) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      const expectedPassword = cashier.shiftPassword || '123456';
      if (expectedPassword !== body.shiftPassword) {
        return NextResponse.json({ error: 'Incorrect shift password' }, { status: 401 });
      }
      return NextResponse.json({ success: true });
    }

    // action === 'close' — shiftPassword already validated above (fail-fast)

    const cashier = await prisma.user.findUnique({ where: { id: targetCashierId }, select: { shiftPassword: true, username: true } });
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

      const cancelledFilter = { notIn: ['Cancelled', 'CANCELLED', 'cancelled'] };

      // Aggregate all payment methods in a single groupBy query
      const agg = await tx.order.groupBy({
        by: ['paymentMethod'],
        _sum: { totalPrice: true },
        _count: true,
        where: { shiftId: activeShift.id, status: cancelledFilter },
      });

      let totalCash = 0, totalInstaPay = 0, totalVodafoneCash = 0, totalVisa = 0;
      let orderCount = 0;
      for (const row of agg) {
        const method = (row.paymentMethod || '').toLowerCase();
        const sum = row._sum.totalPrice || 0;
        if (method.includes('cash')) totalCash = sum;
        else if (method.includes('instapay')) totalInstaPay = sum;
        else if (method.includes('vodafone')) totalVodafoneCash = sum;
        else if (method.includes('visa')) totalVisa = sum;
        orderCount += row._count;
      }
      const expectedTotal = totalCash + totalInstaPay + totalVodafoneCash + totalVisa;
      const actualCashValue = body.actualCash ?? 0;
      const discrepancy = actualCashValue - expectedTotal;

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

      return {
        orderCount,
        expectedTotal,
        totalCash,
        totalInstaPay,
        totalVodafoneCash,
        totalVisa,
        actualCash: actualCashValue,
        discrepancy,
        shiftId: activeShift.id,
        shiftStartedAt: activeShift.startTime,
        cashierName: activeShift.cashierName || cashier?.username || 'Cashier',
      };
    });

    // Record in ShiftLog OUTSIDE transaction to avoid blocking shift close
    try {
      await prisma.shiftLog.create({
        data: {
          userId: targetCashierId,
          userName: result.cashierName,
          shiftId: result.shiftId,
          shiftStartedAt: result.shiftStartedAt,
          shiftEndedAt: new Date(),
          ordersCount: result.orderCount,
          cashExpected: result.totalCash,
          instapayExpected: result.totalInstaPay,
          vodafoneCashExpected: result.totalVodafoneCash,
          visaExpected: result.totalVisa,
          totalExpected: result.expectedTotal,
          actualCashInDrawer: result.actualCash,
        },
      });
    } catch (logErr) {
      console.error('ShiftLog creation failed (non-blocking):', logErr);
    }

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
