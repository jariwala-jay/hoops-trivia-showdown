import { NextResponse } from 'next/server';

export async function GET() {
  const logoutUrl = new URL(`${process.env.AUTH0_ISSUER_BASE_URL}/v2/logout`);
  logoutUrl.searchParams.set('client_id', process.env.AUTH0_CLIENT_ID!);
  logoutUrl.searchParams.set('returnTo', process.env.AUTH0_BASE_URL!);

  const response = NextResponse.redirect(logoutUrl.toString());
  
  // Clear the session cookie
  response.cookies.set('auth0_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0, // Expire immediately
  });

  return response;
} 