'use client';

import Link from 'next/link';

export default function Navbar() {
  // Note: Auth0 integration temporarily simplified to avoid import errors
  // The AuthButton component can be used separately on pages that need it
  
  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      backgroundColor: 'rgba(17, 24, 39, 0.8)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(55, 65, 81, 0.5)'
    }}>
      <div style={{
        maxWidth: '80rem',
        margin: '0 auto',
        padding: '0 1rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '4rem'
        }}>
          {/* Logo/Title */}
          <Link href="/" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            textDecoration: 'none'
          }}>
            <div style={{ fontSize: '1.5rem' }}>🏀</div>
            <div style={{
              fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
              fontWeight: 700,
              fontSize: '1.25rem',
              color: '#F8F9FA'
            }}>
              Hoops Trivia Showdown
            </div>
          </Link>

          {/* User Section */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <Link
              href="/api/auth/login"
              className="btn btn-primary"
              style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 