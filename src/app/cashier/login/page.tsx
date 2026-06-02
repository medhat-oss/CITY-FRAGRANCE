'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CashierLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/cashier-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      const redirect = searchParams.get('redirect') || '/cashier';
      router.push(redirect);
    } catch {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #060608 0%, #0a0a0f 50%, #060608 100%)',
      padding: '1.5rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: 'rgba(17, 17, 24, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '3rem 2.5rem',
        boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{
            fontFamily: 'var(--font-heading, "Instrument Sans", sans-serif)',
            fontSize: '1.6rem',
            fontWeight: 600,
            color: '#ffffff',
            letterSpacing: '0.2em',
            marginBottom: '0.4rem',
            background: 'linear-gradient(to right, #ffffff, #c5a880)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            CITY FRAGRANCE
          </h1>
          <div style={{
            fontFamily: 'var(--font-heading, "Instrument Sans", sans-serif)',
            fontSize: '0.72rem',
            color: '#c5a880',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}>
            Cashier POS System
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{
              display: 'block',
              fontFamily: 'var(--font-heading, "Instrument Sans", sans-serif)',
              fontSize: '0.8rem',
              color: '#94a3b8',
              marginBottom: '0.6rem',
              letterSpacing: '0.05em',
            }}>
              Username or Email
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="e.g. cashier1"
              style={{
                width: '100%',
                padding: '0.85rem 1.1rem',
                background: '#09090d',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#ffffff',
                fontFamily: 'var(--font-body, "Jost", sans-serif)',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'all 0.25s ease',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#c5a880';
                e.target.style.boxShadow = '0 0 0 3px rgba(197, 168, 128, 0.25)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontFamily: 'var(--font-heading, "Instrument Sans", sans-serif)',
              fontSize: '0.8rem',
              color: '#94a3b8',
              marginBottom: '0.6rem',
              letterSpacing: '0.05em',
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '0.85rem 1.1rem',
                background: '#09090d',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#ffffff',
                fontFamily: 'var(--font-body, "Jost", sans-serif)',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'all 0.25s ease',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#c5a880';
                e.target.style.boxShadow = '0 0 0 3px rgba(197, 168, 128, 0.25)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {error && (
            <p style={{
              color: '#f87171',
              fontSize: '0.85rem',
              fontFamily: 'var(--font-body, "Jost", sans-serif)',
              margin: 0,
              textAlign: 'center',
              background: 'rgba(239, 68, 68, 0.1)',
              padding: '0.5rem',
              borderRadius: '6px',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.9rem',
              background: loading ? '#475569' : 'linear-gradient(135deg, #c5a880, #9a7b56)',
              color: '#0a0a0b',
              border: 'none',
              borderRadius: '10px',
              fontFamily: 'var(--font-heading, "Instrument Sans", sans-serif)',
              fontSize: '0.95rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.25s ease',
              textTransform: 'uppercase',
              boxShadow: '0 4px 15px rgba(197, 168, 128, 0.2)',
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.transform = 'none'; }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{
          marginTop: '2.5rem',
          textAlign: 'center',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '1.5rem',
        }}>
          <a href="/" style={{
            fontFamily: 'var(--font-body, "Jost", sans-serif)',
            fontSize: '0.85rem',
            color: '#64748b',
            textDecoration: 'none',
            transition: 'color 0.2s',
          }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
          >
            &larr; Back to Store
          </a>
        </div>
      </div>
    </div>
  );
}

export default function CashierLoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#060608' }} />}>
      <CashierLoginForm />
    </Suspense>
  );
}
