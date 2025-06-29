import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// Create HTTP link using the Dapper GraphQL endpoint from config
const httpLink = createHttpLink({
  uri: process.env.GRAPHQL_API_URL || 'https://staging.accounts.meetdapper.com/graphql',
});

// Auth link to add Auth0 token to requests
const authLink = setContext(async (_, { headers }) => {
  // Only add auth on client side
  if (typeof window === 'undefined') {
    return { headers };
  }

  try {
    // Get the token from the Auth0 access token endpoint
    const response = await fetch('/api/access-token');
    
    if (!response.ok) {
      console.error('Failed to fetch access token:', response.status);
      
      // Check for auth errors
      if (response.status === 401) {
        try {
          const errorData = await response.json();
          if (errorData.requiresLogin) {
            console.log('[APOLLO] Token expired, user needs to re-authenticate');
            // Don't redirect here as Apollo might retry - let the component handle it
            return { headers };
          }
        } catch {
          // Ignore JSON parse errors
        }
      }
      
      return { headers };
    }
    
    const data = await response.json();
    const token = data?.accessToken;

    if (!token) {
      console.error('No access token received');
      return { headers };
    }

    // Return headers with Bearer token
    return {
      headers: {
        ...headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    };
  } catch (error) {
    console.error('Error getting auth token:', error);
    return { headers };
  }
});

// Create Apollo Client instance matching Dapper's pattern
export const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: from([authLink, httpLink]),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});

// Export aliases for consistency
export const apolloClient = client;
export const dapperApolloClient = client; 