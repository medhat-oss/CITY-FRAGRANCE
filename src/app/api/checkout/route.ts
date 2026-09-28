import { NextResponse } from 'next/server';
import { rateLimit, extractIp } from '@/lib/rateLimit';

interface CheckoutRequestBody {
  amount?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  items?: unknown[];
  paymentMethod?: string;
}

const SANDBOX_KEY = process.env.PAYMENT_GATEWAY_SANDBOX_KEY;
const CARD_INTEGRATION = process.env.PAYMENT_INTEGRATION_ID;
const WALLET_INTEGRATION = process.env.PAYMENT_WALLET_INTEGRATION_ID;

const HAS_KEYS = Boolean(SANDBOX_KEY && CARD_INTEGRATION && WALLET_INTEGRATION);
const IS_TEST_MODE = process.env.NEXT_PUBLIC_PAYMENT_MODE === 'test' || !HAS_KEYS;

export async function POST(request: Request) {
  try {
    const ip = extractIp(request);
    const check = rateLimit(`checkout:${ip}`, 5, 60000);
    if (!check.allowed) {
      return NextResponse.json(
        { success: false, error: `Too many requests. Try again in ${check.retryAfter} seconds.` },
        { status: 429, headers: { 'Retry-After': String(check.retryAfter) } }
      );
    }

    const body = (await request.json()) as CheckoutRequestBody;
    const { amount, firstName, lastName = '', email, phone, items = [], paymentMethod = 'card' } = body;

    // Validate required fields
    if (!amount || !firstName || !email || !phone) {
      return NextResponse.json(
        { success: false, error: 'Missing required order fields.' },
        { status: 400 }
      );
    }

    const isWallet = paymentMethod === 'wallet';
    const integrationId = isWallet ? WALLET_INTEGRATION : CARD_INTEGRATION;

    // ─── SANDBOX / MOCK FLOW ────────────────────────────────────────────
    if (IS_TEST_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 650));

      const prefix = isWallet ? 'WALLET' : 'CARD';
      const mockToken = `TEST_${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

      const mockRedirectUrl = isWallet
        ? `https://accept.paymob.com/api/acceptance/iframes/${integrationId || 'DEMO_WALLET'}?payment_token=${mockToken}&source.identifier=${encodeURIComponent(phone)}&source.subtype=WALLET`
        : `https://accept.paymob.com/api/acceptance/iframes/${integrationId || 'DEMO_CARD'}?payment_token=${mockToken}`;

      return NextResponse.json({
        success: true,
        mode: 'test',
        paymentMethod,
        paymentKey: mockToken,
        redirectUrl: mockRedirectUrl,
        order: {
          id: `CF-${Date.now()}`,
          amount,
          currency: 'EGP',
          customer: { firstName, lastName, email, phone },
          items,
        },
      });
    }

    return NextResponse.json({ success: false, error: 'Production keys not configured.' }, { status: 503 });
  } catch (err) {
    console.error('[PAYMENT API ERROR]', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}
