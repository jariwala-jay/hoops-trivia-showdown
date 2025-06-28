import { Auth0Client } from '@auth0/nextjs-auth0/server';

// Initialize Auth0 using v4 API with custom routes to match existing /api/ setup
export const auth0 = new Auth0Client({
  // Use standard Auth0 v4 environment variable names
  domain: process.env.AUTH0_DOMAIN!,
  clientId: process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!,
  appBaseUrl: process.env.AUTH0_BASE_URL!,
  secret: process.env.AUTH0_SECRET!,
  
  // Authorization parameters (manually specified in v4)
  authorizationParameters: {
    scope: `${process.env.AUTH0_SCOPE!} offline_access`, // Add offline_access for refresh tokens
    audience: process.env.AUTH0_AUDIENCE!,
  },
});

// Simple config value getter that reads from environment variables
function getConfigValue(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

// Also export the config getter for use in other parts of the app
export { getConfigValue }; 