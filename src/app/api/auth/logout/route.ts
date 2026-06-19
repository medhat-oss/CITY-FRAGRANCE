import { NextResponse } from 'next/server';
import { clearAdminSession } from '@/lib/auth';

export const runtime = 'edge';
export async function POST() {
  await clearAdminSession();
  return NextResponse.json({ success: true });
}
