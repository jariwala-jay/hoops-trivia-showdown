import type { NextRequest } from 'next/server';
import { auth0 } from './lib/auth0';

export async function middleware(request: NextRequest) {
  return await auth0.middleware(request);
}

export const config = {
  matcher: [
    // Only match the auth-related API routes
    '/api/login',
    '/api/logout', 
    '/api/callback',
    '/api/access-token',
  ],
}; 