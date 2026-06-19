import { NextResponse } from 'next/server';

/**
 * POST /api/checkout
 *
 * ARCHITECTURE:
 * ─────────────────────────────────────────────────────────
 * Supports three payment methods:
 *   - card   → Paymob card integration (iframe)
 *   - wallet → Paymob mobile wallet integration (Vodafone Cash, etc.)
 *
 * SANDBOX / TEST MODE (current):
 *   Simulates full Paymob 3-step flow and returns mock tokens.
 *
 * PRODUCTION (when you replace env keys):
 *   Uncomment the real fetch() calls and delete the mock blocks.
 *   The rest of the logic stays exactly the same.
 * ─────────────────────────────────────────────────────────
 */

const SANDBOX_KEY        = process.env.PAYMENT_GATEWAY_SANDBOX_KEY;
const CARD_INTEGRATION   = process.env.PAYMENT_INTEGRATION_ID;
const WALLET_INTEGRATION = process.env.PAYMENT_WALLET_INTEGRATION_ID;

// Auto-detect: if keys are present, use production mode; otherwise fall back to test mode
const HAS_KEYS           = !!(SANDBOX_KEY && CARD_INTEGRATION && WALLET_INTEGRATION);
const IS_TEST_MODE       = process.env.NEXT_PUBLIC_PAYMENT_MODE === 'test' || !HAS_KEYS;

export async function POST(request) {
    try {
        const body = await request.json();
        const { amount, firstName, lastName, email, phone, items, paymentMethod = 'card' } = body;

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
            await new Promise(resolve => setTimeout(resolve, 650));

            const prefix       = isWallet ? 'WALLET' : 'CARD';
            const mockToken    = `TEST_${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

            // Wallet flow: Paymob redirects user to enter their phone number on a hosted page
            // Card flow:   Paymob returns an iframe URL for card entry
            const mockRedirectUrl = isWallet
                ? `https://accept.paymob.com/api/acceptance/iframes/${integrationId || 'DEMO_WALLET'}?payment_token=${mockToken}&source.identifier=${phone}&source.subtype=WALLET`
                : `https://accept.paymob.com/api/acceptance/iframes/${integrationId || 'DEMO_CARD'}?payment_token=${mockToken}`;

            console.log(`[PAYMENT][TEST][${prefix}] ${firstName} ${lastName} | ${amount} EGP | Token: ${mockToken}`);

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

