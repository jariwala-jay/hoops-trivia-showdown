import { NextRequest, NextResponse } from 'next/server';

function decodeJWT(token: string) {
  try {
    // Decode JWT without verification (just for debugging)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { error: 'Invalid JWT format' };
    }
    
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    
    return {
      header,
      payload,
      audience: payload.aud,
      issuer: payload.iss,
      subject: payload.sub,
      expiresAt: payload.exp,
      issuedAt: payload.iat,
      scopes: payload.scope?.split(' ') || []
    };
  } catch (error) {
    return { error: 'Failed to decode JWT', details: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the session cookie
    const sessionCookie = request.cookies.get('auth0_session');
    
    if (!sessionCookie?.value) {
      return NextResponse.json({
        error: 'No authentication session found'
      }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    
    const result = {
      sessionKeys: Object.keys(session),
      tokens: {
        access_token: session.access_token ? {
          present: true,
          format: session.access_token.split('.').length === 5 ? 'JWE (5 parts)' : 
                  session.access_token.split('.').length === 3 ? 'JWS (3 parts)' : 'Unknown',
          preview: session.access_token.substring(0, 50) + '...',
          decoded: session.access_token.split('.').length === 3 ? 
                   decodeJWT(session.access_token) : 'Cannot decode JWE token'
        } : { present: false },
        
        id_token: session.id_token ? {
          present: true,
          format: session.id_token.split('.').length === 5 ? 'JWE (5 parts)' : 
                  session.id_token.split('.').length === 3 ? 'JWS (3 parts)' : 'Unknown',
          preview: session.id_token.substring(0, 50) + '...',
          decoded: session.id_token.split('.').length === 3 ? 
                   decodeJWT(session.id_token) : 'Cannot decode JWE token'
        } : { present: false }
      }
    };

    return NextResponse.json(result, { 
      headers: { 'Content-Type': 'application/json' } 
    });
    
  } catch (error) {
    console.error('Debug auth error:', error);
    return NextResponse.json({
      error: 'Failed to debug authentication',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 