'use client';

import BrandedLoadingScreen from '@/components/BrandedLoadingScreen';

export default function AdminLoading() {
  return (
    <BrandedLoadingScreen
      subtitle="Enterprise ERP & CRM"
      status="Loading Module..."
      fullScreen={false}
    />
  );
}
