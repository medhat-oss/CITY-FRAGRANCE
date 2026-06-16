'use client';

export default function CashierLoading() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#070B13', gap: '1.25rem',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        border: '3px solid rgba(255,255,255,0.08)',
        borderTopColor: '#ffffff',
        animation: 'cashierSpin 0.8s linear infinite',
      }} />
      <p style={{
        color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-heading)', fontSize: '0.8rem',
        letterSpacing: '0.12em', margin: 0,
      }}>
        Loading POS…
      </p>
      <style>{`@keyframes cashierSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
