// Shared shift totals aggregation. Mirrors the proven groupBy pattern used by
// the cashier POS endpoint and the shift-close flow: sums non-cancelled orders
// per payment method for a shift. Single source of truth for admin views so
// OPEN shifts show live totals without requiring a close.

import prisma from '@/lib/prisma';

export interface ShiftTotals {
  totalCash: number;
  totalInstaPay: number;
  totalVodafoneCash: number;
  totalVisa: number;
  expectedTotal: number;
  orderCount: number;
}

const CANCELLED_STATUSES = ['Cancelled', 'CANCELLED', 'cancelled'];

export async function computeShiftTotals(shiftId: string): Promise<ShiftTotals> {
  const agg = await prisma.order.groupBy({
    by: ['paymentMethod'],
    _sum: { totalPrice: true },
    _count: true,
    where: { shiftId, status: { notIn: CANCELLED_STATUSES } },
  });

  let totalCash = 0;
  let totalInstaPay = 0;
  let totalVodafoneCash = 0;
  let totalVisa = 0;
  let orderCount = 0;

  for (const row of agg as any[]) {
    const method = (row.paymentMethod || '').toLowerCase();
    const sum = row._sum.totalPrice || 0;
    if (method.includes('cash')) totalCash = sum;
    else if (method.includes('instapay')) totalInstaPay = sum;
    else if (method.includes('vodafone')) totalVodafoneCash = sum;
    else if (method.includes('visa')) totalVisa = sum;
    orderCount += row._count;
  }

  const expectedTotal = totalCash + totalInstaPay + totalVodafoneCash + totalVisa;
  return { totalCash, totalInstaPay, totalVodafoneCash, totalVisa, expectedTotal, orderCount };
}
