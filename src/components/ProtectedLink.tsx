'use client';

import { useUser } from '@auth0/nextjs-auth0';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import AnimatedButton from './AnimatedButton';

interface ProtectedLinkProps {
  href: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

function LoginModal({ isOpen, onClose, redirectTo }: { isOpen: boolean; onClose: () => void; redirectTo?: string }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  
  if (!isOpen) return null;

  const handleLogin = () => {
    const loginUrl = redirectTo 
      ? `/api/auth/login?returnTo=${encodeURIComponent(redirectTo)}`
      : '/api/auth/login';
    window.location.href = loginUrl;
  };

  const modalContent = (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#1F2937',
        borderRadius: '1rem',
        padding: '2rem',
        maxWidth: '28rem',
        width: '100%',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
        animation: 'modalFadeIn 0.3s ease-out'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            width: '4rem',
            height: '4rem',
            backgroundColor: 'rgba(255, 110, 0, 0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
            fontSize: '1.5rem'
          }}>
            🏀
          </div>
          <h2 style={{
            fontSize: '1.5rem',
            fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
            fontWeight: 700,
            color: '#F8F9FA',
            marginBottom: '0.5rem'
          }}>
            Login Required
          </h2>
          <p style={{
            color: '#D1D5DB',
            lineHeight: '1.5'
          }}>
            You need to be logged in to participate in trivia battles and stake your NBA TOPSHOT NFTs.
          </p>
        </div>

        {/* Benefits */}
        <div style={{
          marginBottom: '2rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '0.75rem'
          }}>
            <div style={{
              width: '1.5rem',
              height: '1.5rem',
              backgroundColor: 'rgba(0, 193, 118, 0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem'
            }}>
              ✓
            </div>
            <span style={{ color: '#D1D5DB', fontSize: '0.875rem' }}>
              Access your NBA TopShot NFTs
            </span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '0.75rem'
          }}>
            <div style={{
              width: '1.5rem',
              height: '1.5rem',
              backgroundColor: 'rgba(0, 193, 118, 0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem'
            }}>
              ✓
            </div>
            <span style={{ color: '#D1D5DB', fontSize: '0.875rem' }}>
              Compete in trivia battles
            </span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{
              width: '1.5rem',
              height: '1.5rem',
              backgroundColor: 'rgba(0, 193, 118, 0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem'
            }}>
              ✓
            </div>
            <span style={{ color: '#D1D5DB', fontSize: '0.875rem' }}>
              Win and claim opponent NFTs
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '0.75rem'
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              backgroundColor: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '0.5rem',
              color: '#D1D5DB',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Cancel
          </button>
          <div style={{ flex: 2 }}>
            <div style={{ width: '100%' }}>
              <AnimatedButton 
                variant="primary" 
                size="md"
                onClick={handleLogin}
                className="w-full"
              >
                Login with Dapper
              </AnimatedButton>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
  
  return isMounted ? createPortal(modalContent, document.body) : null;
}

export default function ProtectedLink({ href, children, style, className }: ProtectedLinkProps) {
  const { user } = useUser();
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (user) {
      // User is authenticated, navigate normally
      router.push(href);
    } else {
      // User is not authenticated, show login modal
      setShowLoginModal(true);
    }
  };

  return (
    <>
      <div 
        onClick={handleClick}
        style={{ 
          cursor: 'pointer', 
          textDecoration: 'none',
          display: 'inline-block',
          ...style 
        }}
        className={className}
      >
        {children}
      </div>
      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        redirectTo={href}
      />
    </>
  );
} 