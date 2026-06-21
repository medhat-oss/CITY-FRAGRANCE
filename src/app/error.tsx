'use client'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  console.error('CRITICAL_ERROR_STACK:', error.stack)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', padding: 20, textAlign: 'center' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: 8 }}>500</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>Something went wrong. Check server logs.</p>
      <button onClick={() => reset()} style={{ padding: '8px 24px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: 6, background: '#fff', fontSize: '0.9rem' }}>
        Try again
      </button>
    </div>
  )
}
