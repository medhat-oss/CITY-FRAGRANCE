import { NextResponse } from 'next/server';
import { clearCashierSession } from '@/lib/auth';

export async function POST() {
  await clearCashierSession();
  return NextResponse.json({ success: true });
}
