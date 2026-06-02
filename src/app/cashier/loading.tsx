'use client';

export default function CashierLoading() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#0a0a0b', gap: '1.25rem',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        border: '3px solid rgba(197, 168, 128, 0.15)',
        borderTopColor: '#c5a880',
        animation: 'cashierSpin 0.8s linear infinite',
      }} />
      <p style={{
        color: '#64748b', fontFamily: 'var(--font-heading)', fontSize: '0.8rem',
        letterSpacing: '0.12em', margin: 0,
      }}>
        Loading POS…
      </p>
      <style>{`@keyframes cashierSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
