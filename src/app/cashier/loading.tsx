'use client';

import BrandedLoadingScreen from '@/components/BrandedLoadingScreen';

export default function CashierLoading() {
  return <BrandedLoadingScreen subtitle="Point of Sale" status="Initializing POS Station..." fullScreen={true} />;
}
