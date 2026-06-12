import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const session = await verifySession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Atomically delete orders (frees FK references) then all shifts
    const [deleteResult] = await prisma.$transaction([
      prisma.order.deleteMany(),
      prisma.shift.deleteMany(),
    ]);
    const deletedOrders = deleteResult.count;

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
