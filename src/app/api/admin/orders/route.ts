// AI GUARDRAIL: MULTI-ACCOUNT ISOLATION — POS order creation must use `session.id`
// exclusively. Never trust client-provided cashierId/userId fields.
// Failure to scope by session will cause concurrent cashier orders to cross-contaminate.

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { readJsonFile, writeJsonFile } from '@/lib/dataFile';
import { verifySession, verifySessionForPOS } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

function generateOrderId(prefix = 'CF'): string {
  return `${prefix}-${String(Date.now()).slice(-6)}`;
}

function generateItemId(): string {
  return Math.random().toString(36).substring(2, 10);
}

async function injectProductImages(orders: any[]): Promise<any[]> {
  const names = [...new Set(orders.flatMap((o) => (o.items as any[])?.map((i: any) => i.name) || []))];
  if (!names.length) return orders;
  const products = await prisma.product.findMany({
    where: { name: { in: names, mode: 'insensitive' } },
    select: { name: true, images: true },
  });
  const imageMap = new Map<string, string>();
  for (const p of products) {
    const arr = p.images as string[];
    imageMap.set(p.name.toLowerCase(), arr?.[0] || '');
  }
  return orders.map((o) => ({
    ...o,
    items: (o.items as any[])?.map((item: any) => ({
      ...item,
      id: item.id || Math.random().toString(36).substring(2, 10),
      image: imageMap.get(item.name.toLowerCase()) || '',
    })) || [],
  }));
}


export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      where: { source: { not: 'POS' } },
      orderBy: { createdAt: 'desc' },
      select: {
        orderId: true, customerName: true, totalPrice: true,
        status: true, paymentMethod: true, date: true,
        createdAt: true, source: true, items: true,
        phoneNumber: true, address: true, city: true,
        governorate: true, apartment: true, email: true,
        cashierId: true, shiftId: true,
      },
    });
    const enriched = await injectProductImages(orders);
    return NextResponse.json({ orders: enriched });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      customerName: string;
      phoneNumber: string;
      email: string;
      address: string;
      apartment: string;
      city: string;
      governorate: string;
      items: OrderItem[];
      totalPrice: number;
      paymentMethod?: string;
      source?: string;
    };

    // Determine source and cashierId from session
    let source = 'WEB';
    let cashierId: string | null = null;
    let shiftId: string | null = null;

    if (body.source === 'POS') {
      const session = await verifySessionForPOS();
      if (session && (session.role === 'CASHIER' || session.role === 'ADMIN')) {
        source = 'POS';
        cashierId = session.id;
      }
    }

    // ── Ensure every item has an id ──
    const itemsWithIds = body.items.map((item) => ({
      ...item,
      id: item.id || generateItemId(),
    }));

    // ── Sequential order creation + stock deduction + shift resolution ──
    if (source === 'POS' && cashierId) {
      const activeShift = await prisma.shift.findFirst({
        where: { cashierId, status: 'OPEN' },
        select: { id: true },
      });
      if (!activeShift) {
        throw new Error('No active shift found. Please open a shift first.');
      }
      shiftId = activeShift.id;
    }

    const order = await prisma.order.create({
      data: {
        orderId: generateOrderId(source === 'POS' ? 'POS' : 'CF'),
        customerName: body.customerName,
        phoneNumber: body.phoneNumber,
        email: body.email || '',
        address: body.address,
        apartment: body.apartment || '',
        city: body.city,
        governorate: body.governorate || '',
        items: JSON.parse(JSON.stringify(itemsWithIds)),
        totalPrice: body.totalPrice,
        status: 'ACCEPTED',
        date: new Date().toLocaleDateString('en-CA'),
        paymentMethod: body.paymentMethod || null,
        source,
        cashierId,
        shiftId,
      },
    });

    for (const item of itemsWithIds) {
      const product = await prisma.product.findFirst({
        where: { name: { equals: item.name, mode: 'insensitive' } },
        select: { id: true, stock: true, name: true },
      });

      if (product) {
        if (product.stock < item.quantity) {
          throw new Error(
            `Insufficient stock for "${product.name}": requested ${item.quantity}, available ${product.stock}`
          );
        }
        await prisma.product.update({
          where: { id: product.id },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }

    // ── JSON file sync (for legacy analytics / gift-set stock) ──
    try {
      const [products, giftSets] = await Promise.all([
        readJsonFile<any[]>('products.json', []),
        readJsonFile<any[]>('gift-sets.json', []),
      ]);
      let updatedProducts = false;
      let updatedGiftSets = false;

      for (const item of itemsWithIds) {
        const pIdx = products.findIndex(
          (p) => p.name && p.name.toLowerCase() === item.name.toLowerCase()
        );
        if (pIdx !== -1) {
          const currentStock = typeof products[pIdx].stock === 'number' ? products[pIdx].stock : 0;
          products[pIdx].stock = Math.max(0, currentStock - item.quantity);
          updatedProducts = true;
        } else {
          const gIdx = giftSets.findIndex(
            (g) => g.name && g.name.toLowerCase() === item.name.toLowerCase()
          );
          if (gIdx !== -1) {
            const currentStock = typeof giftSets[gIdx].stock === 'number' ? giftSets[gIdx].stock : 0;
            giftSets[gIdx].stock = Math.max(0, currentStock - item.quantity);
            updatedGiftSets = true;
          }
        }
      }

      if (updatedProducts) {
        await writeJsonFile('products.json', products);
      }
      if (updatedGiftSets) {
        await writeJsonFile('gift-sets.json', giftSets);
      }

      revalidatePath('/');
      revalidatePath('/cashier');
      revalidatePath('/admin/analytics');
      revalidatePath('/collections/gift-sets');
      revalidatePath('/collections/all-fragrances');
    } catch (stockErr) {
      console.error('JSON STOCK SYNC ERROR (non-blocking):', stockErr);
    }

    return NextResponse.json({ success: true, order });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save order';
    if (message.toLowerCase().includes('insufficient stock')) {
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { orderId: string; status: string };

    // Fetch current order to check previous status and get items
    const existingOrder = await prisma.order.findUnique({
      where: { orderId: body.orderId },
    });

    if (!existingOrder) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const newStatus = body.status;
    const prevStatus = existingOrder.status;

    // Normalize status to title case for consistent filtering
    const normalizedStatus = newStatus.charAt(0).toUpperCase() + newStatus.slice(1).toLowerCase();

    // Lock: once Cancelled, status can never be changed again
    if (prevStatus.toLowerCase() === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'Cancelled orders cannot be modified.' },
        { status: 400 }
      );
    }

    const isNowCancelled = normalizedStatus === 'Cancelled';
    const items = (existingOrder.items as { name: string; quantity: number; price: number }[]) || [];

    // ── Sequential stock restoration + status update ──
    if (isNowCancelled) {
      for (const item of items) {
        const product = await prisma.product.findFirst({
          where: { name: { equals: item.name, mode: 'insensitive' } },
          select: { id: true },
        });
        if (product) {
          await prisma.product.update({
            where: { id: product.id },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
    }

    const order = await prisma.order.update({
      where: { orderId: body.orderId },
      data: { status: normalizedStatus },
    });

    // ── JSON file sync (for legacy gift-set stock) ──
    if (isNowCancelled) {
      try {
        const products = await readJsonFile<any[]>('products.json', []);
        const giftSets = await readJsonFile<any[]>('gift-sets.json', []);
        let updatedProducts = false;
        let updatedGiftSets = false;

        for (const item of items) {
          const pIdx = products.findIndex(
            (p) => p.name && p.name.toLowerCase() === item.name.toLowerCase()
          );
          if (pIdx !== -1) {
            products[pIdx].stock = (products[pIdx].stock || 0) + item.quantity;
            updatedProducts = true;
          } else {
            const gIdx = giftSets.findIndex(
              (g) => g.name && g.name.toLowerCase() === item.name.toLowerCase()
            );
            if (gIdx !== -1) {
              giftSets[gIdx].stock = (giftSets[gIdx].stock || 0) + item.quantity;
              updatedGiftSets = true;
            }
          }
        }

        if (updatedProducts) await writeJsonFile('products.json', products);
        if (updatedGiftSets) await writeJsonFile('gift-sets.json', giftSets);

        revalidatePath('/');
        revalidatePath('/cashier');
        revalidatePath('/admin/analytics');
        revalidatePath('/collections/gift-sets');
        revalidatePath('/collections/all-fragrances');
      } catch (stockErr) {
        console.error('JSON STOCK RESTORE ERROR (non-blocking):', stockErr);
      }
    }

    // --- Recalculate Shift Totals (if order is tied to a shift) ---
    if (order.shiftId) {
      try {
        const ordersInShift = await prisma.order.findMany({
          where: { shiftId: order.shiftId },
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
          if (method.includes('cash')) {
            totalCash += o.totalPrice;
          } else if (method.includes('instapay')) {
            totalInstaPay += o.totalPrice;
          } else if (method.includes('vodafone')) {
            totalVodafoneCash += o.totalPrice;
          } else if (method.includes('visa')) {
            totalVisa += o.totalPrice;
          }
        }

        await prisma.shift.update({
          where: { id: order.shiftId },
          data: { expectedTotal, orderCount, totalCash, totalInstaPay, totalVodafoneCash, totalVisa },
        });
      } catch (recalcErr) {
        console.error('[SHIFT RECALC ERROR]', recalcErr);
      }
    }

    return NextResponse.json({ success: true, order });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to update order' },
      { status: 500 }
    );
  }
}
