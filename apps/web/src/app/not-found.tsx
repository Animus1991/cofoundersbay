import Link from 'next/link';

export default function NotFound() {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#0f172a', color: '#f8fafc' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            textAlign: 'center',
            padding: '2rem',
          }}
        >
          <p style={{ fontSize: '5rem', fontWeight: 700, margin: 0, lineHeight: 1 }}>404</p>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Page not found</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
            The page you are looking for does not exist.
          </p>
          <Link
            href="/"
            style={{
              marginTop: '0.5rem',
              padding: '0.5rem 1.25rem',
              background: '#22D3EE',
              color: '#000',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            Back to home
          </Link>
        </div>
      </body>
    </html>
  );
}
