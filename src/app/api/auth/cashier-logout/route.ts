import { NextResponse } from 'next/server';
import { clearCashierSession } from '@/lib/auth';

export const runtime = 'edge';
export async function POST() {
  await clearCashierSession();
  return NextResponse.json({ success: true });
}
