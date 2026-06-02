import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const session = await verifySession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete orders first (no FK constraint but logical order)
    const { count: deletedOrders } = await prisma.order.deleteMany();

    // Reset shift records — set all closed shifts to zeroed summaries
    await prisma.shift.updateMany({
      where: { status: 'CLOSED' },
      data: {
        totalCash: 0,
        totalInstaPay: 0,
        totalVodafoneCash: 0,
        totalVisa: 0,
        actualCash: 0,
        expectedTotal: 0,
        discrepancy: 0,
        orderCount: 0,
      },
    });

    // Purge caches so analytics & cashier pages reflect instantly
    revalidatePath('/admin/analytics');
    revalidatePath('/cashier');
    revalidatePath('/admin/orders');
    revalidatePath('/');

    return NextResponse.json({ success: true, deletedOrders });
  } catch (err) {
    console.error('[RESET SALES API]', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Reset failed' },
      { status: 500 },
    );
  }
}
