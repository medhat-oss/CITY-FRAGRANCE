'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
}

export default function AdminSidebarUser() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then((data) => {
        if (data?.user) setUser(data.user);
        else router.replace('/admin/login');
        setLoading(false);
      })
      .catch(() => {
        router.replace('/admin/login');
        setLoading(false);
      });
  }, [router]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/admin/login');
  }

  if (loading) return null;

  return (
    <div style={{
      marginTop: 'auto',
      paddingTop: '1rem',
      borderTop: '1px solid rgba(197, 160, 89, 0.3)',
    }}>
      {user && (
        <div style={{
          fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.6)',
          marginBottom: '0.5rem',
          textAlign: 'center',
        }}>
          {user.email}
        </div>
      )}
      <button
        onClick={handleLogout}
        style={{
          width: '100%',
          padding: '0.6rem',
          background: 'transparent',
          border: '1px solid rgba(197, 160, 89, 0.4)',
          borderRadius: '4px',
          color: '#C5A059',
          fontFamily: 'var(--font-heading, "Instrument Sans", sans-serif)',
          fontSize: '0.75rem',
          letterSpacing: '0.1em',
          cursor: 'pointer',
          transition: 'all 0.2s',
          textTransform: 'uppercase',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(197, 160, 89, 0.15)'; e.currentTarget.style.borderColor = '#C5A059'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(197, 160, 89, 0.4)'; }}
      >
        Logout
      </button>
    </div>
  );
}
