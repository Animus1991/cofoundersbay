import type { NextPageContext } from 'next';
import Link from 'next/link';

type Props = { statusCode: number };

export default function Error({ statusCode }: Props) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem',
        background: '#0f172a',
        color: '#f8fafc',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <p style={{ fontSize: '4rem', fontWeight: 700, margin: 0 }}>{statusCode}</p>
      <p style={{ margin: 0, color: '#94a3b8' }}>
        {statusCode === 404 ? 'Page not found' : 'An error occurred'}
      </p>
      <Link
        href="/"
        style={{
          marginTop: '0.5rem',
          padding: '0.5rem 1.25rem',
          background: '#22D3EE',
          color: '#000',
          borderRadius: '10px',
          textDecoration: 'none',
          fontWeight: 600,
        }}
      >
        Back to home
      </Link>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode ?? 500 : 404;
  return { statusCode };
};
