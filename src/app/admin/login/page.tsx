'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
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
      const res = await fetch('/api/auth/login', {
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

      const redirect = searchParams.get('redirect') || '/admin';
      router.push(redirect);
    } catch {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  }

  return <LoginFormInner {...{ email, setEmail, password, setPassword, error, loading, handleSubmit }} />;
}

function LoginFormInner({ email, setEmail, password, setPassword, error, loading, handleSubmit }: {
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  error: string; loading: boolean;
  handleSubmit: (e: FormEvent) => void;
}) {

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #09142E 0%, #11224D 50%, #09142E 100%)',
      padding: '1rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: '#11224D',
        border: '1px solid #1d3573',
        borderRadius: '12px',
        padding: '2.5rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontFamily: 'var(--font-heading, "Instrument Sans", sans-serif)',
            fontSize: '1.5rem',
            color: '#f8f9fa',
            letterSpacing: '0.15em',
            marginBottom: '0.25rem',
          }}>
            CITY FRAGRANCE
          </h1>
          <span style={{
            fontFamily: 'var(--font-heading, "Instrument Sans", sans-serif)',
            fontSize: '0.7rem',
            color: '#94a3b8',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
          }}>
            Admin Panel
          </span>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{
              display: 'block',
              fontFamily: 'var(--font-heading, "Instrument Sans", sans-serif)',
              fontSize: '0.8rem',
              color: '#94a3b8',
              marginBottom: '0.5rem',
              letterSpacing: '0.05em',
            }}>
              Email / Username
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: '#09142E',
                border: '1px solid #1d3573',
                borderRadius: '8px',
                color: '#f8f9fa',
                fontFamily: 'var(--font-body, "Jost", sans-serif)',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = '#ffffff'}
              onBlur={(e) => e.target.style.borderColor = '#1d3573'}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontFamily: 'var(--font-heading, "Instrument Sans", sans-serif)',
              fontSize: '0.8rem',
              color: '#94a3b8',
              marginBottom: '0.5rem',
              letterSpacing: '0.05em',
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: '#09142E',
                border: '1px solid #1d3573',
                borderRadius: '8px',
                color: '#f8f9fa',
                fontFamily: 'var(--font-body, "Jost", sans-serif)',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = '#ffffff'}
              onBlur={(e) => e.target.style.borderColor = '#1d3573'}
            />
          </div>

          {error && (
            <p style={{
              color: '#ef4444',
              fontSize: '0.85rem',
              fontFamily: 'var(--font-body, "Jost", sans-serif)',
              margin: 0,
              textAlign: 'center',
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.85rem',
              background: loading ? '#64748b' : '#ffffff',
              color: '#09142E',
              border: 'none',
              borderRadius: '8px',
              fontFamily: 'var(--font-heading, "Instrument Sans", sans-serif)',
              fontSize: '0.9rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              textTransform: 'uppercase',
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#e2e8f0'; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = '#ffffff'; }}
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <div style={{
          marginTop: '2rem',
          textAlign: 'center',
          borderTop: '1px solid #1d3573',
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

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#09142E' }} />}>
      <LoginForm />
    </Suspense>
  );
}
