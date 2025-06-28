import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  // const state = searchParams.get('state'); // TODO: Validate state for CSRF protection
  const error = searchParams.get('error');

  if (error) {
    console.error('Auth0 error:', error);
    return NextResponse.redirect(`${process.env.AUTH0_BASE_URL}/?error=${error}`);
  }

  if (!code) {
    return NextResponse.redirect(`${process.env.AUTH0_BASE_URL}/?error=missing_code`);
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch(`${process.env.AUTH0_ISSUER_BASE_URL}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        audience: process.env.AUTH0_AUDIENCE,
        code,
        redirect_uri: `${process.env.AUTH0_BASE_URL}/api/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const tokens = await tokenResponse.json();
    
    // Create session cookie (simplified - in production you'd want proper session management)
    const response = NextResponse.redirect(`${process.env.AUTH0_BASE_URL}/`);
    
    // Set httpOnly cookie with tokens (simplified)
    response.cookies.set('auth0_session', JSON.stringify(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Token exchange error:', error);
    return NextResponse.redirect(`${process.env.AUTH0_BASE_URL}/?error=token_exchange_failed`);
  }
} 