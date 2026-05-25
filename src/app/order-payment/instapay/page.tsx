'use client';

import { Suspense } from 'react';
import PaymentMethodPage from '../PaymentMethodPage';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function InstapayPage({ searchParams: _searchParams }: PageProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09142E] flex items-center justify-center"><p className="text-white font-heading">Loading...</p></div>}>
      <PaymentMethodPage method="instapay" />
    </Suspense>
  );
}
