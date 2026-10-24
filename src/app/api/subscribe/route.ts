import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { rateLimit, extractIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    const ip = extractIp(request);
    const check = rateLimit(`subscribe:${ip}`, 5, 60000);
    if (!check.allowed) {
      return NextResponse.json(
        { success: false, message: `Too many requests. Try again in ${check.retryAfter} seconds.` },
        { status: 429, headers: { 'Retry-After': String(check.retryAfter) } }
      );
    }

    const { email } = (await request.json()) as { email: string };
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email address' },
        { status: 400 }
      );
    }

    const existing = await prisma.subscriber.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Already subscribed' },
        { status: 409 }
      );
    }

    await prisma.subscriber.create({
      data: { email: normalizedEmail },
    });

    return NextResponse.json({ success: true, message: 'Subscribed successfully' });
  } catch (err) {
    console.error('SUBSCRIBE ERROR:', err);
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : 'Something went wrong' },
      { status: 500 }
    );
  }
}
