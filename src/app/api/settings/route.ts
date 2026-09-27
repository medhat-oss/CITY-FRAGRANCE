import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  DEFAULT_SHIPPING_RATES,
  DEFAULT_PAYMENT_DETAILS,
} from '@/data/defaults';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await prisma.siteSetting.findUnique({ where: { id: 'default' } });

    const dbRates = settings?.shippingRates as Record<string, number> | null | undefined;
    const shippingRates = (dbRates && Object.keys(dbRates).length > 0) ? dbRates : DEFAULT_SHIPPING_RATES;

    const dbPayment = settings?.paymentDetails as Record<string, { title: string; number: string; note: string }> | null | undefined;
    const paymentDetails = (dbPayment && Object.keys(dbPayment).length > 0) ? dbPayment : DEFAULT_PAYMENT_DETAILS;

    const whatsappNumber = settings?.whatsappNumber || '';

    return NextResponse.json({ shippingRates, paymentDetails, whatsappNumber });
  } catch {
    return NextResponse.json({
      shippingRates: DEFAULT_SHIPPING_RATES,
      paymentDetails: DEFAULT_PAYMENT_DETAILS,
      whatsappNumber: '',
    });
  }
}
