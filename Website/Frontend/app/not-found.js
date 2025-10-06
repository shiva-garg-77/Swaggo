/**
 * Custom 404 Not Found Page
 * Prevents undefined length errors in Next.js
 */
'use client';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      textAlign: 'center',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1 style={{
        fontSize: '4rem',
        fontWeight: 'bold',
        margin: '0 0 1rem 0',
        color: '#ef4444'
      }}>
        404
      </h1>
      <h2 style={{
        fontSize: '1.5rem',
        margin: '0 0 2rem 0',
        color: '#374151'
      }}>
        Page Not Found
      </h2>
      <p style={{
        fontSize: '1rem',
        color: '#6b7280',
        maxWidth: '500px',
        lineHeight: '1.6'
      }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <a 
        href="/"
        style={{
          display: 'inline-block',
          marginTop: '2rem',
          padding: '0.75rem 1.5rem',
          backgroundColor: '#3b82f6',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '0.5rem',
          fontSize: '1rem',
          fontWeight: '500',
          transition: 'background-color 0.2s'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
      >
        Go Home
      </a>
    </div>
  );
}