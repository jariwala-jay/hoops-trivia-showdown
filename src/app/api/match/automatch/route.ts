import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { db, AutomatchEntry } from '@/lib/db';
import { auth0 } from '@/lib/auth0';
import { Match, NFT } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user's session
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { nft, action, flowAddress } = body;

    if (!nft || !nft.id) {
      return NextResponse.json({ error: 'NFT data is required' }, { status: 400 });
    }

    if (!action || !['join', 'cancel'].includes(action)) {
      return NextResponse.json({ error: 'Valid action is required (join or cancel)' }, { status: 400 });
    }

    if (action === 'join' && !flowAddress) {
      return NextResponse.json({ error: 'Flow address is required for joining automatch' }, { status: 400 });
    }

    const userId = session.user.sub || session.user.email || 'unknown';
    const userName = session.user.name || session.user.email || 'Player';
    const userAvatar = session.user.picture;

    // Convert the real Dapper moment to our NFT format
    const nftData: NFT = {
      id: nft.id,
      name: nft.name || nft.title || `Token #${nft.id}`,
      image: nft.image || nft.imageURL || '/testImage.jpg',
      rarity: nft.rarity || 'Common',
      collection: nft.collection || nft.contract || 'NBA Top Shot'
    };

    if (action === 'cancel') {
      // Remove user from automatch queue
      const removed = await db.removeFromAutomatchQueue(userId, nftData.rarity || 'Common');
      return NextResponse.json({ 
        status: 'success',
        message: removed ? 'Removed from queue' : 'Not in queue',
        inQueue: false
      });
    }

    // Action is 'join' - try to find an opponent first
    const opponent = await db.findAutomatchOpponent(userId, nftData.rarity || 'Common');

    if (opponent) {
      // Found an opponent! Create a match immediately
      const matchId = uuidv4();
      const questions = await db.getRandomQuestions(5, 'medium');

      // CRITICAL: If we can't get questions, we must put the opponent back in the queue
      if (questions.length < 5) {
        console.error('Not enough questions in DB for automatch. Returning opponent to queue.');
        await db.addToAutomatchQueue(opponent);
        return NextResponse.json({ 
          status: 'error',
          message: 'Could not start match: not enough questions available.' 
        }, { status: 500 });
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
        nftB: nftData,
        questions,
        answersA: [],
        answersB: [],
        scoreA: 0,
        scoreB: 0,
        createdAt: new Date().toISOString(),
        currentQuestionIndex: 0
      };

      const createdMatch = await db.createMatch(match);

      return NextResponse.json({
        status: 'matched',
        message: 'Opponent found! Match created.',
        matchId: createdMatch.id,
        opponent: {
          name: opponent.userName,
          avatar: opponent.userAvatar,
          nft: opponent.nft
        }
      });
    } else {
      // Add user to queue (this will be a fresh entry even if they were already there)
      const queueEntry: AutomatchEntry = {
        userId,
        userName,
        userAvatar,
        flowAddress,
        nft: {
          id: nftData.id,
          name: nftData.name || 'Unknown NFT',
          image: nftData.image || '/testImage.jpg',
          rarity: nftData.rarity || 'Common',
          collection: nftData.collection || 'NBA Top Shot'
        },
        timestamp: Date.now(),
        rarity: nftData.rarity || 'Common'
      };

      await db.addToAutomatchQueue(queueEntry);

      // Get current queue size for this rarity
      const queueSize = await db.getAutomatchQueueSize(nftData.rarity || 'Common');

      return NextResponse.json({
        status: 'queued',
        message: 'Added to matchmaking queue',
        inQueue: true,
        queueSize,
        rarity: nftData.rarity
      });
    }

  } catch (error) {
    console.error('Error in automatch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint to check queue status
export async function GET(request: NextRequest) {
  try {
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rarity = searchParams.get('rarity');

    if (!rarity) {
      return NextResponse.json({ error: 'Rarity parameter is required' }, { status: 400 });
    }

    const queueSize = await db.getAutomatchQueueSize(rarity);

    return NextResponse.json({
      queueSize,
      rarity
    });

  } catch (error) {
    console.error('Error getting queue status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 