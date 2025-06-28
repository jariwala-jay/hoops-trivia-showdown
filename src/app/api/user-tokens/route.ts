import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export type AccessToken = {
  accessToken: string | undefined;
};

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user's session (same as working routes)
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    let accessTokenData: AccessToken | null = null;
    
    try {
      // Call our /api/access-token endpoint exactly like Dapper does
      const tokenResponse = await fetch(`${request.nextUrl.origin}/api/access-token`, {
        headers: {
          'Cookie': request.headers.get('cookie') || ''
        }
      });
      
      if (tokenResponse.ok && tokenResponse.status === 200) {
        accessTokenData = await tokenResponse.json();
      } else {
        const errorData = await tokenResponse.json().catch(() => null);
        console.log('[USER_TOKENS] Access token fetch failed:', tokenResponse.status, errorData);
        
        // Check if this is a token expiration error
        if (errorData?.requiresLogin) {
          return NextResponse.json({ 
            error: 'Authentication expired',
            requiresLogin: true,
            message: 'Please log in again to view your NFTs'
          }, { status: 401 });
        }
        
        return NextResponse.json({ error: 'Failed to fetch access token' }, { status: 401 });
      }
    } catch (error) {
      console.error('Error calling /api/access-token:', error);
      return NextResponse.json({ error: 'Error fetching access token' }, { status: 500 });
    }

    if (!accessTokenData?.accessToken) {
      return NextResponse.json({ error: 'No access token received' }, { status: 401 });
    }

    // Try the real Dapper API following their exact Apollo Client pattern
    const graphqlQuery = {
      query: `
        query GetTokens($input: GetTokensInput!) {
          getTokens(input: $input) {
            tokens {
              id
              title
              description
              imageURL
              serialNumber
              acquiredAt
              isWithdrawInProgress
              favorite
              contract
              dapp {
                id
                name
                tokenFallbackImageURL
                tokenFallbackImageDarkURL
                nftCanBeUsedAsAvatar
              }
              tokenContractData {
                contract
                storageInitializationCadence
                checkInitializationCadence
              }
            }
            totalCount
          }
        }
      `,
      variables: {
        input: {
          limit: 50,
          offset: 0
        }
      }
    };
    
    try {
      const response = await fetch('https://staging.accounts.meetdapper.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': accessTokenData.accessToken, // No "Bearer" prefix - exactly like Dapper's Apollo Client
          'Accept': 'application/graphql-response+json',
          'X-Request-Id': Math.random().toString(36).substring(2), // Generate request ID like Dapper
        },
        body: JSON.stringify(graphqlQuery),
      });

      const data = await response.json();
      
      if (data.errors) {
        console.error('GraphQL errors:', data.errors);
        
        // Check if this is an authentication error
        const authError = data.errors.find((e: { extensions?: { code?: string }; message?: string }) => 
          e.extensions?.code === 'ErrUnauthenticated' || 
          e.message?.includes('invalid token') ||
          e.message?.includes('authentication')
        );
        
        if (authError) {
          console.log('Authentication error detected, falling back to mock data');
          return NextResponse.json({
            data: {
              getTokens: {
                tokens: [
                  {
                    id: "mock-token-1",
                    title: "LeBron James - Epic Dunk (Mock)",
                    description: "Mock data - authentication still being configured",
                    imageURL: "https://assets.nbatopshot.com/media/1.png",
                    serialNumber: 12345,
                    contract: "NBA Top Shot",
                    dapp: {
                      name: "NBA Top Shot",
                      tokenFallbackImageURL: "/testImage.jpg"
                    }
                  }
                ],
                totalCount: 1
              }
            },
            _debug: {
              message: "Fell back to mock data due to authentication errors",
              authMethod: "fetchAccessToken pattern",
              tokenSource: "/api/access-token endpoint",
              authError: {
                message: authError.message,
                code: authError.extensions?.code,
                trace_id: authError.extensions?.trace_id
              },
              allErrors: data.errors
            }
          });
        }
        
        // Fall back to mock data for other errors too
        return NextResponse.json({
          data: {
            getTokens: {
              tokens: [
                {
                  id: "mock-token-1",
                  title: "LeBron James - Epic Dunk (Mock)",
                  description: "Mock data - GraphQL errors occurred",
                  imageURL: "https://assets.nbatopshot.com/media/1.png",
                  serialNumber: 12345,
                  contract: "NBA Top Shot",
                  dapp: {
                    name: "NBA Top Shot",
                    tokenFallbackImageURL: "/testImage.jpg"
                  }
                }
              ],
              totalCount: 1
            }
          },
          _debug: {
            message: "Fell back to mock data due to GraphQL errors",
            authMethod: "fetchAccessToken pattern",
            tokenSource: "/api/access-token endpoint",
            errors: data.errors
          }
        });
      }

      return NextResponse.json({
        ...data,
        _debug: {
          message: "Successfully fetched real tokens",
          authMethod: "fetchAccessToken pattern",
          tokenSource: "/api/access-token endpoint"
        }
      });
      
    } catch (error) {
      console.error('Network error calling Dapper API:', error);
      // Fall back to mock data on network errors
      return NextResponse.json({
        data: {
          getTokens: {
            tokens: [
              {
                id: "mock-token-1",
                title: "LeBron James - Epic Dunk (Mock)",
                description: "Mock data - network error occurred",
                imageURL: "https://assets.nbatopshot.com/media/1.png",
                serialNumber: 12345,
                contract: "NBA Top Shot",
                dapp: {
                  name: "NBA Top Shot",
                  tokenFallbackImageURL: "/testImage.jpg"
                }
              }
            ],
            totalCount: 1
          }
        },
        _debug: {
          message: "Fell back to mock data due to network error",
          authMethod: "fetchAccessToken pattern",
          tokenSource: "/api/access-token endpoint",
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }

  } catch (error) {
    console.error('Error fetching user tokens:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 