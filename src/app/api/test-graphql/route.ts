import { NextRequest, NextResponse } from 'next/server';
import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GET_ACCOUNT } from '@/lib/graphql/queries';

interface AccessToken {
  accessToken: string;
  expiresAt?: number;
}

export async function GET(request: NextRequest) {
  try {
    // Check if user is logged in first
    const sessionCookie = request.cookies.get('auth0_session');
    
    if (!sessionCookie?.value) {
      return NextResponse.json({
        success: false,
        message: 'No authentication session found',
        error: 'User not logged in'
      }, { status: 401 });
    }

    console.log('Fetching access token from localhost:4000...');
    
    let accessTokenData: AccessToken | null = null;
    
    try {
      // Get token from the working local endpoint
      const tokenResponse = await fetch('http://localhost:4000/api/access-token', {
        headers: {
          'Cookie': request.headers.get('cookie') || ''
        }
      });
      
      if (tokenResponse.ok && tokenResponse.status === 200) {
        accessTokenData = await tokenResponse.json();
        console.log('Successfully fetched access token from localhost:4000');
      } else {
        console.log('Failed to fetch access token from localhost:4000:', tokenResponse.status);
        return NextResponse.json({
          success: false,
          message: 'Failed to fetch access token from localhost:4000',
          error: `Token endpoint returned ${tokenResponse.status}`
        }, { status: 401 });
      }
    } catch (error) {
      console.error('Error calling localhost:4000/api/access-token:', error);
      return NextResponse.json({
        success: false,
        message: 'Error fetching access token from localhost:4000',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

    if (!accessTokenData?.accessToken) {
      return NextResponse.json({
        success: false,
        message: 'No access token received',
        error: 'Token endpoint returned null or invalid data'
      }, { status: 401 });
    }

    console.log('Testing GraphQL with staging endpoint...');

    try {
      // Create Apollo Client for the staging GraphQL endpoint
      const httpLink = createHttpLink({
        uri: 'https://staging.accounts.meetdapper.com/graphql',
        fetch: fetch,
      });

      const authLink = setContext(async (_, { headers }) => {
        return {
          headers: {
            ...headers,
            'Authorization': accessTokenData.accessToken,
            'Content-Type': 'application/json',
            'Accept': 'application/graphql-response+json',
            'X-Request-Id': `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          }
        };
      });

      const client = new ApolloClient({
        link: from([authLink, httpLink]),
        cache: new InMemoryCache(),
        defaultOptions: {
          watchQuery: {
            errorPolicy: 'all',
          },
          query: {
            errorPolicy: 'all',
          },
        },
      });

      // Test the GetAccount query
      const result = await client.query({
        query: GET_ACCOUNT,
        errorPolicy: 'all'
      });
      
      const success = !result.errors || result.errors.length === 0;
      
      return NextResponse.json({
        success: true,
        message: 'GraphQL test completed',
        setup: {
          tokenSource: 'http://localhost:4000/api/access-token',
          graphqlEndpoint: 'https://staging.accounts.meetdapper.com/graphql',
          authMethod: 'Direct Token (no Bearer)'
        },
        result: {
          success,
          data: result.data,
          errors: result.errors?.map(e => ({ 
            message: e.message, 
            code: e.extensions?.code,
            trace_id: e.extensions?.trace_id
          }))
        },
        tokenInfo: {
          hasToken: !!accessTokenData.accessToken,
          expiresAt: accessTokenData.expiresAt,
          tokenPreview: accessTokenData.accessToken.substring(0, 50) + '...'
        }
      });

    } catch (error) {
      console.error('GraphQL request failed:', error);
      return NextResponse.json({
        success: false,
        message: 'GraphQL request failed',
        setup: {
          tokenSource: 'http://localhost:4000/api/access-token',
          graphqlEndpoint: 'https://staging.accounts.meetdapper.com/graphql',
          authMethod: 'Direct Token (no Bearer)'
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Test failed:', error);
    return NextResponse.json({
      success: false,
      message: 'Test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 