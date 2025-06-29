'use client';

import Link from 'next/link';

interface ErrorScreenProps {
  error: string;
}

export default function ErrorScreen({ error }: ErrorScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">Match Error</h1>
        <p className="text-xl mb-8">{error}</p>
        <div className="space-x-4">
          <button 
            onClick={() => window.location.reload()} 
            className="bg-white text-red-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100"
          >
            Refresh Page
          </button>
          <Link 
            href="/" 
            className="bg-white text-red-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 