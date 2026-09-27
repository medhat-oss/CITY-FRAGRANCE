import { NextResponse } from 'next/server';
import { readJsonFile, writeJsonFile } from '@/lib/dataFile';
import { rateLimit, extractIp } from '@/lib/rateLimit';

const FILE = 'subscribers.json';

interface Subscriber {
  email: string;
  subscribedAt: string;
}


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

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email address' },
        { status: 400 }
      );
    }

    const subscribers = await readJsonFile<Subscriber[]>(FILE, []);

    if (subscribers.some((s) => s.email.toLowerCase() === email.toLowerCase())) {
      return NextResponse.json(
        { success: false, message: 'Already subscribed' },
        { status: 409 }
      );
    }

    subscribers.push({ email, subscribedAt: new Date().toISOString() });
    await writeJsonFile(FILE, subscribers);

    return NextResponse.json({ success: true, message: 'Subscribed successfully' });
  } catch (err) {
    console.error('SUBSCRIBE ERROR:', err);
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : 'Something went wrong' },
      { status: 500 }
    );
  }
}
