import { NextResponse } from 'next/server';

export async function GET() {
  const domain = process.env.AUTH0_ISSUER_BASE_URL;
  const clientId = process.env.AUTH0_CLIENT_ID;
  const redirectUri = `${process.env.AUTH0_BASE_URL}/api/callback`;
  const scope = `${process.env.AUTH0_SCOPE || 'openid profile email'} offline_access`;
  
  if (!domain || !clientId) {
    return NextResponse.json({ error: 'Auth0 configuration missing' }, { status: 500 });
  }

  const authUrl = new URL(`${domain}/authorize`);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('state', Math.random().toString(36).substring(2));

  return NextResponse.redirect(authUrl.toString());
} 