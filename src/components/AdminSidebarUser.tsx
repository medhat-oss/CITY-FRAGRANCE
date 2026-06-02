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
    let cancelled = false;

    async function loadUser() {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const res = await fetch('/api/auth/me');
          if (cancelled) return;
          if (res.ok) {
            const data = await res.json();
            if (data?.user) {
              if (!cancelled) {
                setUser(data.user);
                setLoading(false);
              }
              return;
            }
          }
          if (res.status === 401 || res.status === 403) break;
        } catch {
          if (attempt === 3) break;
          await new Promise((r) => setTimeout(r, 500));
        }
      }

      // No session — do NOT redirect. The middleware already ensured a cookie
      // was present; a transient server issue may have caused the 401.
      // Setting loading=false will render the "not logged in" state below,
      // and a manual page reload will retry via the middleware.
      if (!cancelled) {
        setLoading(false);
      }
    }

    loadUser();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/admin/login');
  }

  if (loading) return null;

  return (
    <div style={{
      marginTop: 'auto',
      paddingTop: '1rem',
      borderTop: '1px solid rgba(255, 255, 255, 0.15)',
    }}>
      {user ? (
        <>
          <div style={{
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.6)',
            marginBottom: '0.5rem',
            textAlign: 'center',
          }}>
            {user.email}
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '0.6rem',
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '4px',
              color: '#ffffff',
              fontFamily: 'var(--font-heading, "Instrument Sans", sans-serif)',
              fontSize: '0.75rem',
              letterSpacing: '0.1em',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textTransform: 'uppercase',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.borderColor = '#ffffff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'; }}
          >
            Logout
          </button>
        </>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '0.7rem',
            color: 'rgba(255,255,255,0.4)',
            marginBottom: '0.5rem',
          }}>
            Session unavailable
          </div>
          <a
            href="/admin/login"
            style={{
              display: 'inline-block',
              padding: '0.5rem 1rem',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '4px',
              color: '#c5a880',
              fontFamily: 'var(--font-heading, "Instrument Sans", sans-serif)',
              fontSize: '0.7rem',
              letterSpacing: '0.08em',
              textDecoration: 'none',
              textTransform: 'uppercase',
            }}
          >
            Log in
          </a>
        </div>
      )}
    </div>
  );
}
