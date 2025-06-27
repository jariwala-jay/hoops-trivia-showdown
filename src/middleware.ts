import type { NextRequest } from 'next/server';
import { auth0 } from './lib/auth0';

export async function middleware(request: NextRequest) {
  return await auth0.middleware(request);
}

export const config = {
  matcher: [
    // Match both custom auth routes and standard Auth0 routes
    '/api/login',
    '/api/logout', 
    '/api/callback',
    '/api/access-token',
    '/api/auth/:path*',  // Handle all /api/auth/* routes
    '/auth/:path*',      // Handle all /auth/* routes (without /api/)
  ],
}; 