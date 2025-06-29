'use client';

import { useUser } from '@auth0/nextjs-auth0';
import { useRouter } from 'next/navigation';
import AuthGuard from './AuthGuard';

interface ProtectedLinkProps {
  href: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export default function ProtectedLink({ href, children, style, className }: ProtectedLinkProps) {
  const { user } = useUser();
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (user) {
      // User is authenticated, navigate normally
      router.push(href);
    }
    // If not authenticated, AuthGuard will handle showing the modal
  };

  if (user) {
    // User is authenticated, render as normal link behavior
    return (
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
    );
  }

  // User is not authenticated, wrap with AuthGuard
  return (
    <AuthGuard redirectTo={href}>
      <div 
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
    </AuthGuard>
  );
} 