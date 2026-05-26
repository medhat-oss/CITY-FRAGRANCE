'use client';
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import PaymentMethodPage from '../PaymentMethodPage';

export default function VodafoneCashPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09142E] flex items-center justify-center"><p className="text-white font-heading">Loading...</p></div>}>
      <PaymentMethodPage method="vodafone-cash" />
    </Suspense>
  );
}
