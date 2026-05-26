import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

function generateOrderId(): string {
  return `CF-${String(Date.now()).slice(-6)}`;
}

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
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
    };

    const order = await prisma.order.create({
      data: {
        orderId: generateOrderId(),
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
      },
    });

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

    const order = await prisma.order.update({
      where: { orderId: body.orderId },
      data: { status: body.status },
    });

    return NextResponse.json({ success: true, order });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to update order' },
      { status: 500 }
    );
  }
}
