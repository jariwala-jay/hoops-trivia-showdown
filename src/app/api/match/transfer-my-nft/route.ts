import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth0 } from '@/lib/auth0';
import { handleMatchFinishTransfers } from '@/lib/nftTransfer';

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user's session
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { matchId } = body;

    if (!matchId) {
      return NextResponse.json({ error: 'Match ID is required' }, { status: 400 });
    }

    // Get the match
    const match = await db.getMatch(matchId);
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Verify match is finished
    if (match.status !== 'FINISHED') {
      return NextResponse.json({ 
        error: 'Match is not finished yet' 
      }, { status: 400 });
    }

    // Verify the user is a participant in the match
    const isPlayerA = match.playerA.id === session.user.sub;
    const isPlayerB = match.playerB?.id === session.user.sub;
    
    if (!isPlayerA && !isPlayerB) {
      return NextResponse.json({ 
        error: 'You are not a participant in this match' 
      }, { status: 403 });
    }

    // Check if this user is the loser (and thus needs to transfer their NFT)
    const userIsLoser = (isPlayerA && match.winner === 'B') || (isPlayerB && match.winner === 'A');
    
    if (!userIsLoser) {
      return NextResponse.json({ 
        error: 'You are not required to transfer an NFT for this match',
        winner: match.winner,
        userPlayer: isPlayerA ? 'A' : 'B'
      }, { status: 400 });
    }

    // Check if this user's transfer has already been completed
    const userPlayer = isPlayerA ? 'A' : 'B';
    const transferKey = `nftTransfer${userPlayer}Status` as keyof typeof match;
    const attemptKey = `nftTransfer${userPlayer}Attempts` as keyof typeof match;
    
    if (match[transferKey] === 'COMPLETED') {
      return NextResponse.json({ 
        message: 'Your NFT transfer has already been completed',
        status: 'already_completed'
      });
    }

    if (match[transferKey] === 'IN_PROGRESS') {
      return NextResponse.json({ 
        message: 'Your NFT transfer is currently in progress',
        status: 'in_progress'
      });
    }

    // Update match status to indicate this user's transfer is starting
    await db.updateMatch(matchId, {
      [transferKey]: 'IN_PROGRESS',
      [attemptKey]: ((match[attemptKey] as number) || 0) + 1
    });

    console.log(`Starting NFT transfer for match ${matchId}, user ${session.user.sub} (Player ${userPlayer})`);

    // Execute the transfers with the authenticated user's context
    const transferResult = await handleMatchFinishTransfers(match, {
      authenticatedUserId: session.user.sub,
      cookies: request.headers.get('cookie') || ''
    });

    // Update match with transfer results for this specific user
    const updateData: Record<string, unknown> = {
      [transferKey]: transferResult.success ? 'COMPLETED' : 'FAILED',
      [attemptKey]: ((match[attemptKey] as number) || 0) + 1
    };

    if (!transferResult.success) {
      const errorKey = `nftTransfer${userPlayer}Error` as keyof typeof match;
      updateData[errorKey] = transferResult.error;
    }

    await db.updateMatch(matchId, updateData);

    if (transferResult.success) {
      return NextResponse.json({
        status: 'success',
        message: 'Your NFT transfer completed successfully',
        operations: transferResult.operations,
        player: userPlayer
      });
    } else {
      console.error(`NFT transfer failed for user ${session.user.sub} in match ${matchId}:`, transferResult.error);
      
      // If we haven't exceeded max attempts, allow retry
      const maxAttempts = 3;
      const currentAttempts = ((match[attemptKey] as number) || 0) + 1;
      const canRetry = currentAttempts < maxAttempts;
      
      return NextResponse.json({
        status: 'failed',
        message: 'Your NFT transfer failed',
        error: transferResult.error,
        canRetry,
        attempts: currentAttempts,
        maxAttempts,
        player: userPlayer
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in user NFT transfer endpoint:', error);
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to check user's transfer status
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user's session
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');

    if (!matchId) {
      return NextResponse.json({ error: 'Match ID is required' }, { status: 400 });
    }

    const match = await db.getMatch(matchId);
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Determine which player the user is
    const isPlayerA = match.playerA.id === session.user.sub;
    const isPlayerB = match.playerB?.id === session.user.sub;
    
    if (!isPlayerA && !isPlayerB) {
      return NextResponse.json({ 
        error: 'You are not a participant in this match' 
      }, { status: 403 });
    }

    const userPlayer = isPlayerA ? 'A' : 'B';
    const userIsLoser = (isPlayerA && match.winner === 'B') || (isPlayerB && match.winner === 'A');
    
    const transferKey = `nftTransfer${userPlayer}Status` as keyof typeof match;
    const attemptKey = `nftTransfer${userPlayer}Attempts` as keyof typeof match;
    const errorKey = `nftTransfer${userPlayer}Error` as keyof typeof match;

    return NextResponse.json({
      matchId: match.id,
      player: userPlayer,
      isLoser: userIsLoser,
      needsToTransfer: userIsLoser,
      transferStatus: match[transferKey] || 'PENDING',
      transferError: match[errorKey] || null,
      transferAttempts: (match[attemptKey] as number) || 0,
      winner: match.winner,
      canTransfer: match.status === 'FINISHED' && userIsLoser
    });

  } catch (error) {
    console.error('Error checking user transfer status:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 