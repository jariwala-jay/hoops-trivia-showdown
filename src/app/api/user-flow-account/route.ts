import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user's session
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get access token
    const tokenResponse = await fetch(`${process.env.AUTH0_BASE_URL || 'http://localhost:4000'}/api/access-token`, {
      headers: {
        'Cookie': request.headers.get('cookie') || ''
      }
    });

    if (!tokenResponse.ok) {
      return NextResponse.json({ error: 'Failed to get access token' }, { status: 401 });
    }

    const tokenData = await tokenResponse.json();
    if (!tokenData.accessToken) {
      return NextResponse.json({ error: 'No access token available' }, { status: 401 });
    }
    
    const flowResponse = await fetch('https://staging.accounts.meetdapper.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': tokenData.accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `query GetAccount {
          getAccount {
            id
            username
            email
            flowAccountID
            avatarURL
          }
        }`
      })
    });

    if (!flowResponse.ok) {
      const errorText = await flowResponse.text();
      console.error('Flow GraphQL request failed:', flowResponse.status, errorText);
      return NextResponse.json({ error: 'Failed to fetch Flow account' }, { status: 500 });
    }

    const flowData = await flowResponse.json();
    
    if (flowData.errors) {
      console.error('Flow GraphQL errors:', flowData.errors);
      return NextResponse.json({ 
        error: 'GraphQL errors occurred',
        details: flowData.errors 
      }, { status: 500 });
    }

    const account = flowData.data?.getAccount;
    const flowAddress = account?.flowAccountID;
    
    if (!flowAddress) {
      return NextResponse.json({ error: 'No Flow account found' }, { status: 404 });
    }

    return NextResponse.json({ 
      address: flowAddress,
      userId: session.user.sub,
      username: account?.username,
      email: account?.email
    });

  } catch (error) {
    console.error('Error fetching Flow account:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 