// AI GUARDRAIL: MULTI-ACCOUNT ISOLATION — item-level cancellation must scope
// to the session identity. This endpoint restores product stock for a single
// item and recalculates the order total + shift totals.

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function PUT(request: Request) {
  try {
    const session = await verifySession();
    if (!session?.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    const adminCheck = await prisma.$queryRaw<Array<{ role: string }>>`
      SELECT role::text FROM "User" WHERE id = ${session.id} LIMIT 1
    `;
    if (adminCheck.length === 0 || adminCheck[0].role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = (await request.json()) as { orderId: string; orderItemId: string };

    if (!body.orderId || !body.orderItemId) {
      return NextResponse.json(
        { success: false, error: 'orderId and orderItemId are required' },
        { status: 400 }
      );
    }

    // ── Atomic item removal + stock restoration + order total recalculation ──
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { orderId: body.orderId },
        select: { id: true, orderId: true, items: true, totalPrice: true, shiftId: true, status: true },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status.toLowerCase() === 'cancelled') {
        throw new Error('Cannot modify a cancelled order');
      }

      const items = (order.items as { id: string; name: string; quantity: number; price: number }[]) || [];

      const itemIdx = items.findIndex((it) => it.id === body.orderItemId);
      if (itemIdx === -1) {
        throw new Error('Item not found in order');
      }

      const removedItem = items.splice(itemIdx, 1)[0];

      // Restore stock for the removed item
      const product = await tx.product.findFirst({
        where: { name: { equals: removedItem.name, mode: 'insensitive' } },
        select: { id: true },
      });
      if (product) {
        await tx.product.update({
          where: { id: product.id },
          data: { stock: { increment: removedItem.quantity } },
        });
      }

      // Recalculate total price from remaining items
      const newTotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

      // Update the order
      const updated = await tx.order.update({
        where: { orderId: body.orderId },
        data: {
          items: JSON.parse(JSON.stringify(items)),
          totalPrice: newTotal,
        },
        select: { id: true, orderId: true, totalPrice: true, items: true, shiftId: true, status: true },
      });

      return { updated, removedItem, newTotal };
    });

    // --- Recalculate Shift Totals (if order is tied to a shift) ---
    if (result.updated.shiftId) {
      try {
        const ordersInShift = await prisma.order.findMany({
          where: { shiftId: result.updated.shiftId },
          select: { totalPrice: true, paymentMethod: true, status: true },
        });

        let expectedTotal = 0;
        let orderCount = 0;
        let totalCash = 0;
        let totalInstaPay = 0;
        let totalVodafoneCash = 0;
        let totalVisa = 0;

        for (const o of ordersInShift) {
          const orderStatus = (o.status || '').toLowerCase();
          if (orderStatus === 'cancelled') continue;
          expectedTotal += o.totalPrice;
          orderCount++;
          const method = (o.paymentMethod || '').toLowerCase();
          if (method.includes('cash')) totalCash += o.totalPrice;
          else if (method.includes('instapay')) totalInstaPay += o.totalPrice;
          else if (method.includes('vodafone')) totalVodafoneCash += o.totalPrice;
          else if (method.includes('visa')) totalVisa += o.totalPrice;
        }

        await prisma.shift.update({
          where: { id: result.updated.shiftId },
          data: { expectedTotal, orderCount, totalCash, totalInstaPay, totalVodafoneCash, totalVisa },
        });
      } catch (recalcErr) {
        console.error('[SHIFT RECALC ERROR (items)]', recalcErr);
      }
    }

    // --- Look up product images for the response ---
    const itemsArr = result.updated.items as { id: string; name: string; quantity: number; price: number }[];
    const names = [...new Set(itemsArr.map((i) => i.name))];
    const products = await prisma.product.findMany({
      where: { name: { in: names, mode: 'insensitive' } },
      select: { name: true, images: true },
    });
    const imageMap = new Map<string, string>();
    for (const p of products) {
      const arr = p.images as string[];
      imageMap.set(p.name.toLowerCase(), arr?.[0] || '');
    }
    const enrichedItems = itemsArr.map((item) => ({
      ...item,
      image: imageMap.get(item.name.toLowerCase()) || '',
    }));

    return NextResponse.json({
      success: true,
      order: { ...result.updated, items: enrichedItems },
      removedItem: result.removedItem,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to cancel item';
    if (['Order not found', 'Item not found in order', 'Cannot modify a cancelled order'].includes(message)) {
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
