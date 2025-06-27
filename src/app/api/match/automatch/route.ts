import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { db, AutomatchEntry } from '@/lib/db';
import { getRandomQuestions } from '@/lib/questions';
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

    console.log('=== AUTOMATCH DEBUG ===');
    console.log('Full request body:', JSON.stringify(body, null, 2));
    console.log('Received Flow address:', flowAddress);

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

    console.log(`[AUTOMATCH] User ${userId} (${userName}) action: ${action}, rarity: ${nft.rarity}`);

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
    console.log(`[AUTOMATCH] User ${userId} looking for opponent in ${nftData.rarity} queue. Found:`, opponent ? opponent.userName : 'none');

    if (opponent) {
      // Found an opponent! Create a match immediately
      const matchId = uuidv4();
      const questions = getRandomQuestions(5);

      const match: Match = {
        id: matchId,
        status: 'READY',
        playerA: {
          id: uuidv4(),
          name: opponent.userName,
          avatar: opponent.userAvatar,
          flowAddress: opponent.flowAddress
        },
        playerB: {
          id: uuidv4(),
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
      // No opponent found, check if user is already in queue by trying to remove them first
      const wasInQueue = await db.removeFromAutomatchQueue(userId, nftData.rarity || 'Common');
      
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
      console.log(`[AUTOMATCH] User ${userId} ${wasInQueue ? 'updated in' : 'added to'} queue. Queue size now: ${queueSize}`);

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