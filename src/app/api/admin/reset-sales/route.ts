import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    // Delete orders (frees FK references) then all shifts
    const deleteResult = await prisma.order.deleteMany();
    await prisma.shift.deleteMany();
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
