import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { readJsonFile, writeJsonFile } from '@/lib/dataFile';
import { verifySession, verifySessionForPOS } from '@/lib/auth';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

function generateOrderId(prefix = 'CF'): string {
  return `${prefix}-${String(Date.now()).slice(-6)}`;
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
        cashierId: true, shiftId: true,
      },
    });
    return NextResponse.json({ orders });
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
      cashierId?: string;
    };

    // Determine source and cashierId from session or request body
    let source = 'WEB';
    let cashierId: string | null = null;
    let shiftId: string | null = null;

    if (body.source === 'POS') {
      // Use POS-aware session so cashier_session always wins over admin_session
      const session = await verifySessionForPOS(body.cashierId);
      if (session && (session.role === 'CASHIER' || session.role === 'ADMIN')) {
        source = 'POS';
        // Prioritize the cashierId passed from client session context
        cashierId = body.cashierId || session.id;

        const activeShift = await prisma.shift.findFirst({
          where: { cashierId: cashierId, status: 'OPEN' },
          select: { id: true },
        });
        if (!activeShift) {
          return NextResponse.json(
            { success: false, error: 'No active shift found. Please open a shift first.' },
            { status: 400 }
          );
        }
        shiftId = activeShift.id;
      }
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
        items: JSON.parse(JSON.stringify(body.items)),
        totalPrice: body.totalPrice,
        status: 'Pending',
        date: new Date().toLocaleDateString('en-CA'),
        paymentMethod: body.paymentMethod || null,
        source,
        cashierId,
        shiftId,
      },
    });

    // --- Stock Deduction ---
    try {
      const products = await readJsonFile<any[]>('products.json', []);
      const giftSets = await readJsonFile<any[]>('gift-sets.json', []);
      let updatedProducts = false;
      let updatedGiftSets = false;

      for (const item of body.items) {
        // Match product by name (case-insensitive)
        const pIdx = products.findIndex(
          (p) => p.name && p.name.toLowerCase() === item.name.toLowerCase()
        );
        if (pIdx !== -1) {
          const currentStock = typeof products[pIdx].stock === 'number' ? products[pIdx].stock : 0;
          products[pIdx].stock = Math.max(0, currentStock - item.quantity);
          updatedProducts = true;

          // Also try to update DB
          try {
            await prisma.product.updateMany({
              where: { name: { equals: products[pIdx].name, mode: 'insensitive' } },
              data: { stock: { decrement: item.quantity } },
            });
          } catch {
            // ignore safely if table is not synced
          }
        } else {
          // Try to match gift set by name (case-insensitive)
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

      // Revalidate cache to reflect new inventory values
      revalidatePath('/');
      revalidatePath('/collections/gift-sets');
      revalidatePath('/collections/all-fragrances');
    } catch (stockErr) {
      console.error('STOCK DEDUCTION ERROR:', stockErr);
    }

    return NextResponse.json({ success: true, order });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to save order' },
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

    // Lock: once Cancelled, status can never be changed again
    if (prevStatus.toLowerCase() === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'Cancelled orders cannot be modified.' },
        { status: 400 }
      );
    }

    // Prevent duplicate stock restoration
    const isNowCancelled = newStatus.toLowerCase() === 'cancelled';

    if (isNowCancelled) {
      // Restore stock for each item in the order
      const items = (existingOrder.items as { name: string; quantity: number; price: number }[]) || [];

      const products = await readJsonFile<any[]>('products.json', []);
      const giftSets = await readJsonFile<any[]>('gift-sets.json', []);
      let updatedProducts = false;
      let updatedGiftSets = false;

      for (const item of items) {
        // Restore product stock (match by name, case-insensitive)
        const pIdx = products.findIndex(
          (p) => p.name && p.name.toLowerCase() === item.name.toLowerCase()
        );
        if (pIdx !== -1) {
          const currentStock = typeof products[pIdx].stock === 'number' ? products[pIdx].stock : 0;
          products[pIdx].stock = currentStock + item.quantity;
          updatedProducts = true;

          try {
            await prisma.product.updateMany({
              where: { name: { equals: products[pIdx].name, mode: 'insensitive' } },
              data: { stock: { increment: item.quantity } },
            });
          } catch {
            // ignore if table is not synced
          }
        } else {
          // Restore gift set stock (match by name, case-insensitive)
          const gIdx = giftSets.findIndex(
            (g) => g.name && g.name.toLowerCase() === item.name.toLowerCase()
          );
          if (gIdx !== -1) {
            const currentStock = typeof giftSets[gIdx].stock === 'number' ? giftSets[gIdx].stock : 0;
            giftSets[gIdx].stock = currentStock + item.quantity;
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

      // Revalidate cache to reflect restored inventory
      revalidatePath('/');
      revalidatePath('/collections/gift-sets');
      revalidatePath('/collections/all-fragrances');
    }

    const order = await prisma.order.update({
      where: { orderId: body.orderId },
      data: { status: newStatus },
    });

    return NextResponse.json({ success: true, order });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to update order' },
      { status: 500 }
    );
  }
}
