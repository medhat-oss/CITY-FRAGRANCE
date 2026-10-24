import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getCustomers, createCustomer, updateCustomerSegment } from '@/actions/crm-customers';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const customers = await getCustomers();
    return NextResponse.json({ customers, success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch customers';
    return NextResponse.json({ error: message, success: false }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const customer = await createCustomer(body);
    return NextResponse.json({ customer, success: true }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create customer';
    return NextResponse.json({ error: message, success: false }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { id, segment } = body;
    if (!id || !segment) {
      return NextResponse.json({ error: 'Missing customer ID or segment', success: false }, { status: 400 });
    }
    const customer = await updateCustomerSegment(id, segment);
    return NextResponse.json({ customer, success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update customer segment';
    return NextResponse.json({ error: message, success: false }, { status: 400 });
  }
}
