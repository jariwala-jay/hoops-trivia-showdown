'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Navbar({ authButton }: { authButton?: React.ReactNode }) {
  // Note: Auth0 integration temporarily simplified to avoid import errors
  // The AuthButton component can be used separately on pages that need it
  
  return (
    <nav className="fixed top-0 left-0 w-full bg-gray-900 bg-opacity-80 backdrop-blur-md shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <Image 
                src="/logo.png" 
                alt="Hoops Trivia Showdown Logo" 
                width={50} 
                height={50}
                className="h-12 w-auto" 
              />
            </Link>
            <Link href="/" className="text-white text-2xl font-extrabold ml-4 tracking-wider" style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}>
              HOOPS TRIVIA SHOWDOWN
            </Link>
          </div>
          <div className="flex items-center">
            {authButton}
          </div>
        </div>
      </div>
    </nav>
  );
} 