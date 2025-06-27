import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('auth0_session');
    
    if (!sessionCookie?.value) {
      return NextResponse.json({ user: null });
    }

    const session = JSON.parse(sessionCookie.value);
    
    if (!session.access_token) {
      return NextResponse.json({ user: null });
    }

    // Get user info from Auth0
    const userResponse = await fetch(`${process.env.AUTH0_ISSUER_BASE_URL}/userinfo`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!userResponse.ok) {
      return NextResponse.json({ user: null });
    }

    const user = await userResponse.json();
    return NextResponse.json({ 
      user,
      accessToken: session.access_token // Include access token for GraphQL requests
    });
    
  } catch (error) {
    console.error('Error getting user info:', error);
    return NextResponse.json({ user: null });
  }
} 