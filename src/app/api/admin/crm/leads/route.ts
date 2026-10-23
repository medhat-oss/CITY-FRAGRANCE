import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getCrmLeads, createCrmLead, updateCrmLeadStatus } from '@/actions/crm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const leads = await getCrmLeads();
    return NextResponse.json({ leads, success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch leads';
    return NextResponse.json({ error: message, success: false }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const lead = await createCrmLead(body);
    return NextResponse.json({ lead, success: true }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create lead';
    return NextResponse.json({ error: message, success: false }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { id, status } = body;
    if (!id || !status) {
      return NextResponse.json({ error: 'Missing lead id or status', success: false }, { status: 400 });
    }
    const lead = await updateCrmLeadStatus(id, status);
    return NextResponse.json({ lead, success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update lead status';
    return NextResponse.json({ error: message, success: false }, { status: 400 });
  }
}
