'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaSpinner } from 'react-icons/fa';

export default function LegacyCashierRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/cashier');
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '60vh',
      color: '#cbd5e1',
      gap: '1rem',
    }}>
      <FaSpinner className="animate-spin" style={{ fontSize: '2rem', color: '#a78bfa' }} />
      <p style={{ fontSize: '0.95rem' }}>Redirecting to isolated Cashier route...</p>
    </div>
  );
}
