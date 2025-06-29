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
    const isParticipant = match.playerA.id === session.user.sub || 
                         match.playerB?.id === session.user.sub;
    
    if (!isParticipant) {
      return NextResponse.json({ 
        error: 'You are not a participant in this match' 
      }, { status: 403 });
    }

    // Check if transfers have already been processed
    if (match.nftTransferStatus === 'COMPLETED') {
      return NextResponse.json({ 
        message: 'NFT transfers have already been completed',
        status: 'already_completed'
      });
    }

    if (match.nftTransferStatus === 'IN_PROGRESS') {
      return NextResponse.json({ 
        message: 'NFT transfers are currently in progress',
        status: 'in_progress'
      });
    }

    // Update match status to indicate transfer is starting
    await db.updateMatch(matchId, {
      nftTransferStatus: 'IN_PROGRESS',
      nftTransferAttempts: (match.nftTransferAttempts || 0) + 1
    });

    console.log(`Starting NFT transfer for match ${matchId}`);
    console.log(`Authenticated user: ${session.user.sub}`);

    // Execute the transfers with authenticated user context
    const transferResult = await handleMatchFinishTransfers(match, {
      authenticatedUserId: session.user.sub
    });

    // Update match with transfer results
    const updateData: {
      nftTransferStatus: 'COMPLETED' | 'FAILED';
      nftTransferError?: string;
      nftTransferAttempts: number;
    } = {
      nftTransferStatus: transferResult.success ? 'COMPLETED' : 'FAILED',
      nftTransferAttempts: (match.nftTransferAttempts || 0) + 1
    };

    if (!transferResult.success) {
      updateData.nftTransferError = transferResult.error;
    }

    await db.updateMatch(matchId, updateData);

    if (transferResult.success) {
      return NextResponse.json({
        status: 'success',
        message: 'NFT transfers completed successfully',
        operations: transferResult.operations
      });
    } else {
      console.error(`NFT transfer failed for match ${matchId}:`, transferResult.error);
      
      // If we haven't exceeded max attempts, allow retry
      const maxAttempts = 3;
      const canRetry = (match.nftTransferAttempts || 0) < maxAttempts;
      
      return NextResponse.json({
        status: 'failed',
        message: 'NFT transfer failed',
        error: transferResult.error,
        canRetry,
        attempts: match.nftTransferAttempts || 0,
        maxAttempts
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in NFT transfer endpoint:', error);
    
    // Try to update match status to failed if we have matchId
    const body = await request.json().catch(() => ({}));
    if (body.matchId) {
      try {
        const match = await db.getMatch(body.matchId);
        if (match) {
          await db.updateMatch(body.matchId, {
            nftTransferStatus: 'FAILED',
            nftTransferError: error instanceof Error ? error.message : 'Unknown error',
            nftTransferAttempts: (match.nftTransferAttempts || 0) + 1
          });
        }
      } catch (updateError) {
        console.error('Failed to update match status after error:', updateError);
      }
    }

    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to check transfer status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');

    if (!matchId) {
      return NextResponse.json({ error: 'Match ID is required' }, { status: 400 });
    }

    const match = await db.getMatch(matchId);
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    return NextResponse.json({
      matchId: match.id,
      transferStatus: match.nftTransferStatus || 'PENDING',
      transferError: match.nftTransferError,
      transferAttempts: match.nftTransferAttempts || 0,
      winner: match.winner,
      canTransfer: match.status === 'FINISHED' && match.winner !== 'TIE'
    });

  } catch (error) {
    console.error('Error checking transfer status:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 