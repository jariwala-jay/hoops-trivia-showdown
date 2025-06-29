import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { auth0 } from '@/lib/auth0';

// Store active match SSE connections
const matchConnections = new Map<string, {
  controller: ReadableStreamDefaultController;
  userId: string;
  userName: string;
  matchId: string;
  lastUpdateTime: number;
  interval?: NodeJS.Timeout;
  timeout?: NodeJS.Timeout;
  closed: boolean;
}>();

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth0.getSession();
    if (!session) {
      return new Response('Authentication required', { status: 401 });
    }

    // Await params for NextJS 15 compatibility
    const resolvedParams = await params;
    const matchId = resolvedParams.id;
    if (!matchId) {
      return new Response('Match ID is required', { status: 400 });
    }

    const userId = session.user.sub || session.user.email || 'unknown';
    const userName = session.user.name || session.user.email || 'Player';

    // Get initial match state
    const match = await db.getMatch(matchId);
    if (!match) {
      return new Response('Match not found', { status: 404 });
    }

    // Create SSE stream
    const stream = new ReadableStream({
      start(controller) {
        // Store this connection
        const connectionKey = `${matchId}-${userId}`;
        
        // Clean up any existing connection for this key
        const existingConnection = matchConnections.get(connectionKey);
        if (existingConnection) {
          cleanupConnection(connectionKey);
        }

        matchConnections.set(connectionKey, {
          controller,
          userId,
          userName,
          matchId,
          lastUpdateTime: Date.now(),
          closed: false
        });

        // Send initial match state
        safeEnqueue(controller, {
          type: 'match_state',
          match: match
        });

        // Send connection confirmation
        safeEnqueue(controller, {
          type: 'connected',
          message: 'Connected to match updates'
        });

        // Start monitoring for match updates
        startMatchMonitoring(connectionKey);

        // Cleanup on disconnect
        request.signal.addEventListener('abort', () => {
          cleanupConnection(connectionKey);
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    });

  } catch (error) {
    console.error('Error in match SSE:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

function safeEnqueue(controller: ReadableStreamDefaultController, data: Record<string, unknown>) {
  try {
    controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
    return true;
  } catch {
    // Controller is likely closed
    return false;
  }
}

function safeClose(controller: ReadableStreamDefaultController) {
  try {
    controller.close();
    return true;
  } catch {
    // Controller is likely already closed
    return false;
  }
}

function cleanupConnection(connectionKey: string) {
  const connection = matchConnections.get(connectionKey);
  if (!connection || connection.closed) {
    return;
  }

  // Mark as closed to prevent multiple cleanup attempts
  connection.closed = true;

  // Clear intervals and timeouts
  if (connection.interval) {
    clearInterval(connection.interval);
  }
  if (connection.timeout) {
    clearTimeout(connection.timeout);
  }

  // Close controller safely
  safeClose(connection.controller);

  // Remove from connections map
  matchConnections.delete(connectionKey);
}

function startMatchMonitoring(connectionKey: string) {
  const connection = matchConnections.get(connectionKey);
  if (!connection || connection.closed) return;

  const { matchId } = connection;

  // Check for match updates every 1 second
  const interval = setInterval(async () => {
    const currentConnection = matchConnections.get(connectionKey);
    if (!currentConnection || currentConnection.closed) {
      clearInterval(interval);
      return;
    }

    try {
      const match = await db.getMatch(matchId);
      if (!match) {
        // Match was deleted
        const success = safeEnqueue(currentConnection.controller, {
          type: 'match_deleted',
          message: 'Match no longer exists'
        });
        
        if (success) {
          cleanupConnection(connectionKey);
        }
        clearInterval(interval);
        return;
      }

      // Send update if enough time has passed (throttle to every 500ms)
      if (Date.now() - currentConnection.lastUpdateTime > 500) {
        const success = safeEnqueue(currentConnection.controller, {
          type: 'match_update',
          match: match,
          timestamp: Date.now()
        });
        
        if (!success) {
          // Controller is closed, cleanup
          cleanupConnection(connectionKey);
          clearInterval(interval);
          return;
        }
        
        currentConnection.lastUpdateTime = Date.now();
      }

      // Check if match is finished
      if (match.status === 'FINISHED') {
        const success = safeEnqueue(currentConnection.controller, {
          type: 'match_finished',
          match: match,
          winner: match.winner
        });
        
        if (success) {
          // Keep connection alive for 2 minutes after match finishes to allow results viewing
          setTimeout(() => {
            cleanupConnection(connectionKey);
          }, 2 * 60 * 1000); // 2 minutes to view results
        }
        
        clearInterval(interval);
      }

    } catch (error) {
      console.error('Error monitoring match:', error);
      const success = safeEnqueue(currentConnection.controller, {
        type: 'error',
        message: 'Error getting match updates'
      });
      
      if (!success) {
        cleanupConnection(connectionKey);
        clearInterval(interval);
      }
    }
  }, 1000);

  // Store interval reference for cleanup
  connection.interval = interval;

  // Auto-cleanup after 30 minutes
  const timeout = setTimeout(() => {
    cleanupConnection(connectionKey);
  }, 30 * 60 * 1000);

  // Store timeout reference for cleanup
  connection.timeout = timeout;
}

 