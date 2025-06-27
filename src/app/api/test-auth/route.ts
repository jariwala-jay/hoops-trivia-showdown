import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function GET(request: NextRequest) {
  try {
    const session = await auth0.getSession(request);
    
    if (!session) {
      return NextResponse.json({ 
        authenticated: false,
        message: 'No session found'
      });
    }

    return NextResponse.json({ 
      authenticated: true,
      user: session.user,
      message: 'Session found successfully'
    });
  } catch (error) {
    console.error('Error checking session:', error);
    return NextResponse.json({ 
      authenticated: false,
      error: 'Failed to check session'
    }, { status: 500 });
  }
} 