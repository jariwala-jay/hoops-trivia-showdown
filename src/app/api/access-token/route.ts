import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

interface AccessToken {
  accessToken: string;  
  expiresAt?: number;
}

export async function GET(): Promise<NextResponse> {
  try {
    // Check if user is authenticated first
    const session = await auth0.getSession();
    if (!session) {
      console.log('[ACCESS_TOKEN] No session found, user not authenticated');
      return NextResponse.json({ 
        error: 'Not authenticated',
        requiresLogin: true 
      }, { status: 401 });
    }

    // Try to get access token using our configured Auth0 client
    const { token: accessToken } = await auth0.getAccessToken();
    
    if (!accessToken) {
      console.log('[ACCESS_TOKEN] No access token available');
      return NextResponse.json({ 
        error: 'No access token available',
        requiresLogin: true 
      }, { status: 401 });
    }

    const response: AccessToken = {
      accessToken
    };

    return NextResponse.json(response);
    
  } catch (error: unknown) {
    console.error('Error in /api/access-token using Auth0 SDK:', error);
    
    // Check if this is a token expiration error
    const isTokenError = (error instanceof Error && error.message?.includes('expired')) ||
                        (typeof error === 'object' && error !== null && 'code' in error && 
                         (error as { code: string }).code === 'missing_refresh_token');
    
    if (isTokenError) {
      console.log('[ACCESS_TOKEN] Token expired, user needs to re-authenticate');
      return NextResponse.json({ 
        error: 'Access token expired',
        requiresLogin: true,
        message: 'Please log in again to continue'
      }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to get access token',
      requiresLogin: true 
    }, { status: 401 });
  }
} 