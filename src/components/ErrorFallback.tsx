'use client';

export default function ErrorFallback({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error('CRITICAL_ERROR_STACK:', error.stack);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#09142E',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '4rem',
          height: '4rem',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.15)',
          color: '#ef4444',
          fontSize: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem',
        }}
      >
        !
      </div>

      <h1
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '1.5rem',
          fontWeight: 300,
          color: '#f8fafc',
          marginBottom: '0.5rem',
        }}
      >
        Something went wrong
      </h1>

      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.875rem',
          color: '#94a3b8',
          marginBottom: '2rem',
          maxWidth: '24rem',
        }}
      >
        An unexpected error occurred. Please try again or return to the store.
      </p>

      <div
        style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <button
          onClick={() => reset()}
          style={{
            padding: '0.75rem 2rem',
            background: '#f8fafc',
            color: '#09142E',
            border: 'none',
            borderRadius: '2px',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.8rem',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = '0.8')}
          onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
        >
          Try Again
        </button>

        <a
          href="/"
          style={{
            padding: '0.75rem 2rem',
            background: 'transparent',
            color: '#94a3b8',
            border: '1px solid #334155',
            borderRadius: '2px',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.8rem',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            cursor: 'pointer',
            transition: 'border-color 0.2s, color 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = '#f8fafc';
            e.currentTarget.style.color = '#f8fafc';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = '#334155';
            e.currentTarget.style.color = '#94a3b8';
          }}
        >
          Back to Store
        </a>
      </div>
    </div>
  );
}
