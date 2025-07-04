import { NextRequest } from 'next/server';
import { db, AutomatchEntry } from '@/lib/db';
import { auth0 } from '@/lib/auth0';
import { v4 as uuidv4 } from 'uuid';
import { Match, NFT } from '@/types';

// Store active SSE connections
const activeConnections = new Map<string, {
  controller: ReadableStreamDefaultController;
  userId: string;
  userName: string;
  userAvatar?: string;
  flowAddress: string;
  rarity: string;
  nft: NFT;
}>();

export async function GET(request: NextRequest) {
  try {
    const session = await auth0.getSession();
    if (!session) {
      return new Response('Authentication required', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const nftData = searchParams.get('nft');
    const rarity = searchParams.get('rarity');
    const flowAddress = searchParams.get('flowAddress');

    if (!nftData || !rarity) {
      return new Response('NFT data and rarity are required', { status: 400 });
    }

    if (!flowAddress) {
      return new Response('Flow address is required', { status: 400 });
    }

    const nft: NFT = JSON.parse(decodeURIComponent(nftData));
    const userId = session.user.sub || session.user.email || 'unknown';
    const userName = session.user.name || session.user.email || 'Player';
    const userAvatar = session.user.picture;

    // Create SSE stream
    const stream = new ReadableStream({
      start(controller) {
        // Store this connection
        const connectionId = uuidv4();
        activeConnections.set(connectionId, {
          controller,
          userId,
          userName,
          userAvatar,
          flowAddress,
          rarity,
          nft
        });

        // Send initial connection confirmation
        controller.enqueue(`data: ${JSON.stringify({
          type: 'connected',
          message: 'Connected to automatch service'
        })}\n\n`);

        // Try to find immediate match
        findMatchForUser(connectionId);

        // Cleanup on disconnect
        request.signal.addEventListener('abort', () => {
          activeConnections.delete(connectionId);
          // Remove from queue when disconnecting
          db.removeFromAutomatchQueue(userId, rarity);
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
    console.error('Error in SSE automatch:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

async function findMatchForUser(connectionId: string) {
  const connection = activeConnections.get(connectionId);
  if (!connection) return;

  const { controller, userId, userName, userAvatar, flowAddress, rarity, nft } = connection;

  try {
    // Look for an opponent
    const opponent = await db.findAutomatchOpponent(userId, rarity);

    if (opponent) {
      // Found a match! Create the game
      const matchId = uuidv4();
      const questions = await db.getRandomQuestions(5, 'medium');

      if (questions.length < 5) {
        await db.addToAutomatchQueue(opponent);
        
        // Notify the current user of the error
        controller.enqueue(`data: ${JSON.stringify({
          type: 'error',
          message: 'Could not start match: not enough questions available.'
        })}\n\n`);

        // We can't notify the opponent as we may not have their connection, 
        // but they are back in the queue for the next person.
        return;
      }

      const match: Match = {
        id: matchId,
        status: 'READY',
        playerA: {
          id: opponent.userId, // Use Auth0 user ID instead of random UUID
          name: opponent.userName,
          avatar: opponent.userAvatar,
          flowAddress: opponent.flowAddress
        },
        playerB: {
          id: userId, // Use Auth0 user ID instead of random UUID
          name: userName,
          avatar: userAvatar,
          flowAddress: flowAddress
        },
        nftA: {
          id: opponent.nft.id,
          name: opponent.nft.name,
          image: opponent.nft.image,
          rarity: opponent.nft.rarity,
          collection: opponent.nft.collection
        },
        nftB: nft,
        questions,
        answersA: [],
        answersB: [],
        scoreA: 0,
        scoreB: 0,
        createdAt: new Date().toISOString(),
        currentQuestionIndex: 0
      };

      await db.createMatch(match);

      // Notify both players
      controller.enqueue(`data: ${JSON.stringify({
        type: 'match_found',
        matchId: matchId,
        opponent: {
          name: opponent.userName,
          avatar: opponent.userAvatar,
          nft: opponent.nft
        }
      })}\n\n`);

      // Find and notify the opponent
      for (const [opponentConnectionId, opponentConnection] of activeConnections.entries()) {
        if (opponentConnection.userId === opponent.userId) {
          opponentConnection.controller.enqueue(`data: ${JSON.stringify({
            type: 'match_found',
            matchId: matchId,
            opponent: {
              name: userName,
              avatar: userAvatar,
              nft: nft
            }
          })}\n\n`);
          
          // Close opponent's connection
          opponentConnection.controller.close();
          activeConnections.delete(opponentConnectionId);
          break;
        }
      }

      // Close this connection
      controller.close();
      activeConnections.delete(connectionId);

    } else {
      // No opponent found, add to queue and send status
      const queueEntry: AutomatchEntry = {
        userId,
        userName,
        userAvatar,
        flowAddress,
        nft: {
          id: nft.id,
          name: nft.name || 'Unknown NFT',
          image: nft.image || '/testImage.jpg',
          rarity: nft.rarity || 'Common',
          collection: nft.collection || 'NBA Top Shot'
        },
        timestamp: Date.now(),
        rarity: rarity
      };

      await db.addToAutomatchQueue(queueEntry);
      const queueSize = await db.getAutomatchQueueSize(rarity);

      // Send queue status
      controller.enqueue(`data: ${JSON.stringify({
        type: 'queued',
        queueSize: queueSize,
        rarity: rarity
      })}\n\n`);

      // Check for new matches when other players connect
      scheduleMatchCheck(connectionId);
    }

  } catch (error) {
    console.error('Error finding match for user:', error);
    controller.enqueue(`data: ${JSON.stringify({
      type: 'error',
      message: 'Failed to find match'
    })}\n\n`);
  }
}

function scheduleMatchCheck(connectionId: string) {
  // Check for matches every 3 seconds for this user
  const interval = setInterval(async () => {
    const connection = activeConnections.get(connectionId);
    if (!connection) {
      clearInterval(interval);
      return;
    }

    try {
      // Try to find a match again
      const opponent = await db.findAutomatchOpponent(connection.userId, connection.rarity);
      if (opponent) {
        clearInterval(interval);
        await findMatchForUser(connectionId);
      } else {
        // Update queue size
        const queueSize = await db.getAutomatchQueueSize(connection.rarity);
        connection.controller.enqueue(`data: ${JSON.stringify({
          type: 'queue_update',
          queueSize: queueSize
        })}\n\n`);
      }
    } catch (error) {
      console.error('Error in scheduled match check:', error);  
      clearInterval(interval);
    }
  }, 3000);

  // Timeout after 20 seconds
  setTimeout(() => {
    const connection = activeConnections.get(connectionId);
    if (connection) {
      connection.controller.enqueue(`data: ${JSON.stringify({
        type: 'timeout',
        message: 'No opponents found. Try again later!'
      })}\n\n`);
      
      connection.controller.close();
      activeConnections.delete(connectionId);
      db.removeFromAutomatchQueue(connection.userId, connection.rarity);
    }
    clearInterval(interval);
  }, 20000);
} 