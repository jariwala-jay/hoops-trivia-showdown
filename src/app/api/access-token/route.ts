import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

interface AccessToken {
  accessToken: string;  
  expiresAt?: number;
}

export async function GET(): Promise<NextResponse> {
  try {
    // Get access token using our configured Auth0 client
    const { token: accessToken } = await auth0.getAccessToken();
    
    if (!accessToken) {
      return NextResponse.json(null, { status: 401 });
    }

    const response: AccessToken = {
      accessToken
    };

    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error in /api/access-token using Auth0 SDK:', error);
    return NextResponse.json(null, { status: 401 });
  }
} 