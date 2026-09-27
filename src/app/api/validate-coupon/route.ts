import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { rateLimit, extractIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const ip = extractIp(request);
    const check = rateLimit(`validate-coupon:${ip}`, 10, 60000);
    if (!check.allowed) {
      return NextResponse.json(
        { valid: false, error: `Too many requests. Try again in ${check.retryAfter} seconds.` },
        { status: 429 },
      );
    }

    const { code } = (await request.json()) as { code: string };
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ valid: false, error: 'Coupon code is required.' }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });

    if (!coupon) {
      return NextResponse.json({ valid: false, error: 'Invalid coupon code.' });
    }

    if (!coupon.active) {
      return NextResponse.json({ valid: false, error: 'This coupon code is no longer active.' });
    }

    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ valid: false, error: 'This coupon code has reached its usage limit.' });
    }

    return NextResponse.json({ valid: true, discountPct: coupon.discountPct });
  } catch {
    return NextResponse.json({ valid: false, error: 'Failed to validate coupon code.' }, { status: 500 });
  }
}
