'use client';

export default function AdminLoading() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', background: '#070B13', gap: '1.25rem',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        border: '3px solid rgba(255,255,255,0.08)',
        borderTopColor: '#ffffff',
        animation: 'adminSpin 0.8s linear infinite',
      }} />
      <p style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-heading)', fontSize: '0.85rem', letterSpacing: '0.08em', margin: 0 }}>
        Loading…
      </p>
      <style>{`@keyframes adminSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
