import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const ORDERS_PATH = path.join(process.cwd(), 'data', 'orders.json');

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  orderId: string;
  customerName: string;
  phoneNumber: string;
  email: string;
  address: string;
  apartment: string;
  city: string;
  governorate: string;
  items: OrderItem[];
  totalPrice: number;
  status: string;
  date: string;
  paymentMethod?: string;
}

async function readOrders(): Promise<Order[]> {
  try {
    const raw = await fs.readFile(ORDERS_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeOrders(orders: Order[]): Promise<void> {
  await fs.writeFile(ORDERS_PATH, JSON.stringify(orders, null, 2), 'utf-8');
}

function generateOrderId(): string {
  return `CF-${String(Date.now()).slice(-6)}`;
}

export async function GET() {
  const orders = await readOrders();
  return NextResponse.json({ orders });
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

    const order: Order = {
      orderId: generateOrderId(),
      customerName: body.customerName,
      phoneNumber: body.phoneNumber,
      email: body.email || '',
      address: body.address,
      apartment: body.apartment || '',
      city: body.city,
      governorate: body.governorate || '',
      items: body.items,
      totalPrice: body.totalPrice,
      status: 'قيد الانتظار',
      date: new Date().toLocaleDateString('en-CA'),
      paymentMethod: body.paymentMethod,
    };

    const orders = await readOrders();
    orders.unshift(order);
    await writeOrders(orders);

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
    const orders = await readOrders();
    const index = orders.findIndex((o) => o.orderId === body.orderId);
    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }
    orders[index].status = body.status;
    await writeOrders(orders);
    return NextResponse.json({ success: true, order: orders[index] });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to update order' },
      { status: 500 }
    );
  }
}
