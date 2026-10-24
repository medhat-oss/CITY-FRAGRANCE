// AI GUARDRAIL: MULTI-ACCOUNT ISOLATION — POS order creation must use `session.id`
// exclusively. Never trust client-provided cashierId/userId fields.
// Failure to scope by session will cause concurrent cashier orders to cross-contaminate.

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { readJsonFile, writeJsonFile } from '@/lib/dataFile';
import { verifySessionForPOS, requireAdmin } from '@/lib/auth';
import { sendOrderConfirmation, sendOrderStatusUpdate } from '@/lib/email';

export const dynamic = 'force-dynamic';

const VALID_TRANSITIONS: Record<string, string[]> = {
  ACCEPTED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

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
    where: { name: { in: names } },
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
      id: item.id || 'legacy-' + String(item.name).toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + item.price,
      image: imageMap.get(item.name.toLowerCase()) || '',
    })) || [],
  }));
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const orders = await prisma.order.findMany({
      where: { source: { not: 'POS' } },
      orderBy: { createdAt: 'desc' },
      select: {
        orderId: true, customerName: true, totalPrice: true,
        discountCode: true, discountAmount: true,
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
      discountCode?: string;
      discountAmount?: number;
    };

    if (!body.customerName || !body.phoneNumber || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Customer name, phone number, and at least one order item are required.' },
        { status: 400 }
      );
    }

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

    // ── Ensure every item has an id and valid quantity ──
    const itemsWithIds = body.items.map((item) => ({
      ...item,
      id: item.id || generateItemId(),
      quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
    }));

    // ── Sequential order validation + shift resolution ──
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

    // ── Batch stock check + server-side price verification (S1) ──
    const itemNames = itemsWithIds.map(i => i.name);
    const [allProducts, allGiftSets] = await Promise.all([
      prisma.product.findMany({
        where: { name: { in: itemNames } },
        select: { id: true, name: true, stock: true, price: true, salePrice: true },
      }),
      prisma.giftSet.findMany({
        where: { name: { in: itemNames } },
        select: { id: true, name: true, stock: true, price: true },
      }),
    ]);

    interface DbProductInfo {
      id: string;
      name: string;
      stock: number;
      price: number;
      salePrice: number | null;
    }
    interface DbGiftSetInfo {
      id: string;
      name: string;
      stock: number;
      price: number;
    }

    const productMap = new Map<string, DbProductInfo>(
      allProducts.map((p: any) => [p.name.toLowerCase(), p as DbProductInfo])
    );
    const giftSetMap = new Map<string, DbGiftSetInfo>(
      allGiftSets.map((g: any) => [g.name.toLowerCase(), g as DbGiftSetInfo])
    );

    // 1. Stock check BEFORE creating order record (fail-fast)
    for (const item of itemsWithIds) {
      const product = productMap.get(item.name.toLowerCase());
      if (product) {
        if (product.stock < item.quantity) {
          return NextResponse.json(
            { success: false, error: `Insufficient stock for "${product.name}": requested ${item.quantity}, available ${product.stock}` },
            { status: 400 }
          );
        }
      }
    }

    // 2. Compute server-verified unit prices and subtotal (S1)
    let subtotal = 0;
    for (const item of itemsWithIds) {
      const product = productMap.get(item.name.toLowerCase());
      const giftSet = giftSetMap.get(item.name.toLowerCase());

      let unitPrice = Number(item.price) || 0;
      if (source !== 'POS') {
        if (product) {
          unitPrice = typeof product.salePrice === 'number' && product.salePrice > 0 ? product.salePrice : product.price;
        } else if (giftSet) {
          unitPrice = giftSet.price;
        }
      } else {
        // POS: Use database price as fallback if not provided
        if (unitPrice <= 0) {
          if (product) unitPrice = typeof product.salePrice === 'number' && product.salePrice > 0 ? product.salePrice : product.price;
          else if (giftSet) unitPrice = giftSet.price;
        }
      }

      item.price = unitPrice;
      subtotal += unitPrice * item.quantity;
    }

    // 3. Coupon validation & increment (S4)
    let discountCode = '';
    let discountAmount = 0;

    if (body.discountCode) {
      const cleanCode = body.discountCode.trim().toUpperCase();
      try {
        const coupon = await prisma.coupon.findUnique({
          where: { code: cleanCode },
        });

        if (coupon && coupon.active && (coupon.maxUses === 0 || coupon.usedCount < coupon.maxUses)) {
          discountCode = cleanCode;
          discountAmount = Math.round(subtotal * (coupon.discountPct / 100));

          // Increment coupon usage count atomically
          await prisma.coupon.update({
            where: { code: cleanCode },
            data: { usedCount: { increment: 1 } },
          });
        }
      } catch (couponErr) {
        console.error('COUPON VALIDATION ERROR (non-blocking):', couponErr);
      }
    }

    // 4. Calculate final verified total price (S1)
    let shippingCost = 0;
    if (source !== 'POS' && body.governorate) {
      try {
        const settings = await prisma.siteSetting.findUnique({ where: { id: 'default' } });
        const rates = (settings?.shippingRates as Record<string, number>) || {};
        if (typeof rates[body.governorate] === 'number') {
          shippingCost = rates[body.governorate];
        }
      } catch {
        shippingCost = 0;
      }
    }

    const verifiedTotalPrice = Math.max(0, subtotal + shippingCost - discountAmount);

    // 5. Create Order with verified data
    const order = await prisma.order.create({
      data: {
        orderId: generateOrderId(source === 'POS' ? 'POS' : 'CF'),
        customerName: body.customerName,
        phoneNumber: body.phoneNumber,
        email: body.email || '',
        address: body.address || '',
        apartment: body.apartment || '',
        city: body.city || '',
        governorate: body.governorate || '',
        items: JSON.parse(JSON.stringify(itemsWithIds)),
        totalPrice: verifiedTotalPrice,
        discountCode,
        discountAmount,
        status: 'ACCEPTED',
        date: new Date().toLocaleDateString('en-CA'),
        paymentMethod: body.paymentMethod || null,
        source,
        cashierId,
        shiftId,
      },
    });

    // 6. Deduct stock in database
    for (const item of itemsWithIds) {
      const product = productMap.get(item.name.toLowerCase());
      if (product) {
        await prisma.product.update({
          where: { id: product.id },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }

    // ── JSON file sync (for legacy analytics / gift-set stock) ──
    try {
      const giftSets = await readJsonFile<any[]>('gift-sets.json', []);
      let updatedGiftSets = false;

      for (const item of itemsWithIds) {
        const gIdx = giftSets.findIndex(
          (g) => g.name && g.name.toLowerCase() === item.name.toLowerCase()
        );
        if (gIdx !== -1) {
          const currentStock = typeof giftSets[gIdx].stock === 'number' ? giftSets[gIdx].stock : 0;
          giftSets[gIdx].stock = Math.max(0, currentStock - item.quantity);
          updatedGiftSets = true;
        }
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

    // ── Notification email (non-blocking) ──
    if (body.email) {
      sendOrderConfirmation({
        orderId: order.orderId,
        customerName: order.customerName,
        email: order.email,
        phoneNumber: order.phoneNumber,
        address: order.address,
        apartment: order.apartment,
        city: order.city,
        governorate: order.governorate,
        items: itemsWithIds,
        totalPrice: order.totalPrice,
        discountCode: order.discountCode || undefined,
        discountAmount: order.discountAmount || 0,
        status: order.status,
        paymentMethod: order.paymentMethod || undefined,
      }).catch(() => {});
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
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await request.json()) as { orderId: string; status: string };

    // Fetch current order to check previous status and get items
    const existingOrder = await prisma.order.findUnique({
      where: { orderId: body.orderId },
    });

    if (!existingOrder) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const newStatus = body.status?.toUpperCase();
    const prevStatus = (existingOrder.status || '').toUpperCase();

    // Validate transition
    const allowedNext = VALID_TRANSITIONS[prevStatus];
    if (!allowedNext || allowedNext.length === 0) {
      return NextResponse.json(
        { success: false, error: `Orders with status "${prevStatus}" cannot be modified.` },
        { status: 400 }
      );
    }

    if (!newStatus || !allowedNext.includes(newStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status transition from "${prevStatus}" to "${newStatus}". Allowed: ${allowedNext.join(', ')}.`,
        },
        { status: 400 }
      );
    }

    const isNowCancelled = newStatus === 'CANCELLED';
    const items = (existingOrder.items as { name: string; quantity: number; price: number }[]) || [];

    // ── Sequential stock restoration + status update ──
    if (isNowCancelled) {
      const itemNames = items.map(i => i.name);
      const allProducts: any[] = await prisma.product.findMany({
        where: { name: { in: itemNames } },
        select: { id: true, name: true },
      });
      const productMap = new Map(allProducts.map((p: any) => [p.name.toLowerCase(), p]));

      for (const item of items) {
        const product = productMap.get(item.name.toLowerCase());
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
      data: { status: newStatus },
    });

    // ── JSON file sync (for legacy gift-set stock) ──
    if (isNowCancelled) {
      try {
        const giftSets = await readJsonFile<any[]>('gift-sets.json', []);
        let updatedGiftSets = false;

        for (const item of items) {
          const gIdx = giftSets.findIndex(
            (g) => g.name && g.name.toLowerCase() === item.name.toLowerCase()
          );
          if (gIdx !== -1) {
            giftSets[gIdx].stock = (giftSets[gIdx].stock || 0) + item.quantity;
            updatedGiftSets = true;
          }
        }

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

    // ── Notification email (non-blocking) ──
    const notifyStatuses = ['CONFIRMED', 'SHIPPED', 'DELIVERED'];
    if (existingOrder.email && notifyStatuses.includes(newStatus)) {
      sendOrderStatusUpdate({
        orderId: order.orderId,
        customerName: order.customerName,
        email: order.email,
        phoneNumber: order.phoneNumber,
        address: order.address,
        apartment: order.apartment,
        city: order.city,
        governorate: order.governorate,
        items: items,
        totalPrice: order.totalPrice,
        discountCode: order.discountCode || undefined,
        discountAmount: order.discountAmount || 0,
        status: order.status,
        paymentMethod: order.paymentMethod || undefined,
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, order });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to update order' },
      { status: 500 }
    );
  }
}
