'use client';

import { useUser } from '@auth0/nextjs-auth0';
import Image from 'next/image';
import { truncateName } from '@/lib/utils';

export default function ClientAuthButton() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div style={{
        width: '2rem',
        height: '2rem',
        border: '2px solid rgba(255, 110, 0, 0.3)',
        borderTop: '2px solid #FF6E00',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {user.picture && (
            <Image
              src={user.picture} 
              alt={user.name || 'User'} 
              className="w-8 h-8 rounded-full"
              width={100}
              height={100}
            />
          )}
          <span className="text-white font-medium">
            {truncateName(user.name || user.email)}
          </span>
        </div>
        <a 
          href="/auth/logout"
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Logout
        </a>
      </div>
    );
  }

  return (
    <a 
      href="/api/auth/login"
      className="px-6 py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-colors"
    >
      Login
    </a>
  );
} 