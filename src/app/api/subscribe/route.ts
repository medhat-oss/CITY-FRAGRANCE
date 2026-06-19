import { NextResponse } from 'next/server';
import { readJsonFile, writeJsonFile } from '@/lib/dataFile';

const FILE = 'subscribers.json';

interface Subscriber {
  email: string;
  subscribedAt: string;
}

export const runtime = 'edge';
export async function POST(request: Request) {
  try {
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
