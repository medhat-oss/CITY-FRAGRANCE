'use client';

import { Suspense } from 'react';
import PaymentMethodPage from '../PaymentMethodPage';

export default function BankTransferPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09142E] flex items-center justify-center"><p className="text-white font-heading">Loading...</p></div>}>
      <PaymentMethodPage method="bank-transfer" />
    </Suspense>
  );
}
