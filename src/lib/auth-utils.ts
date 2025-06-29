export interface AuthError {
  requiresLogin?: boolean;
  error?: string;
  message?: string;
}

export function isAuthError(data: unknown): data is AuthError {
  return (
    data !== null &&
    typeof data === 'object' &&
    'requiresLogin' in data &&
    (data as AuthError).requiresLogin === true
  );
}

export function handleAuthError(error: AuthError): void {
  console.log('[AUTH] Token expired, redirecting to login');
  
  // Show a user-friendly message
  if (typeof window !== 'undefined') {
    // You can customize this based on your UI library
    alert(error.message || 'Your session has expired. Please log in again.');
    
    // Redirect to login
    window.location.href = '/auth/login';
  }
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const response = await fetch(url, options);
  
  // Check if the response indicates an auth error
  if (response.status === 401) {
    try {
      const data = await response.json();
      if (isAuthError(data)) {
        handleAuthError(data);
        throw new Error(data.message || 'Authentication required');
      }
    } catch (jsonError) {
      // If we can't parse JSON, it's still a 401 error
      console.error('Auth error - could not parse response:', jsonError);
      handleAuthError({ requiresLogin: true, message: 'Please log in again' });
      throw new Error('Authentication required');
    }
  }
  
  return response;
}

// Helper for API calls that might need authentication
export async function apiCall(url: string, options: RequestInit = {}) {
  try {
    const response = await fetchWithAuth(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API call to ${url} failed:`, error);
    throw error;
  }
} 