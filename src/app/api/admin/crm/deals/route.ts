import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getPipelineDeals, createDeal, updateDealStage } from '@/actions/crm-deals';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const { deals, leads } = await getPipelineDeals();
    return NextResponse.json({ deals, leads, success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch pipeline deals';
    return NextResponse.json({ error: message, success: false }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const deal = await createDeal(body);
    return NextResponse.json({ deal, success: true }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create deal';
    return NextResponse.json({ error: message, success: false }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { id, stage } = body;
    if (!id || !stage) {
      return NextResponse.json({ error: 'Missing deal ID or stage', success: false }, { status: 400 });
    }
    const deal = await updateDealStage(id, stage);
    return NextResponse.json({ deal, success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update deal stage';
    return NextResponse.json({ error: message, success: false }, { status: 400 });
  }
}
