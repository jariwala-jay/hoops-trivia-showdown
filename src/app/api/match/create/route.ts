import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
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
    const { nft } = body; // Now expecting the full NFT object instead of just ID

    if (!nft || !nft.id) {
      return NextResponse.json({ error: 'NFT data is required' }, { status: 400 });
    }

    // Convert the real Dapper moment to our NFT format
    const nftData: NFT = {
      id: nft.id,
      name: nft.name || nft.title || `Token #${nft.id}`,
      image: nft.image || nft.imageURL || '/testImage.jpg',
      rarity: nft.rarity || 'Common',
      collection: nft.collection || nft.contract || 'NBA Top Shot'
    };

    const matchId = uuidv4();
    const questions = getRandomQuestions(5);

    const match: Match = {
      id: matchId,
      status: 'PENDING',
      playerA: {
        id: uuidv4(),
        name: session.user.name || session.user.email || 'Player 1',
        avatar: session.user.picture
      },
      nftA: nftData,
      questions,
      answersA: [],
      answersB: [],
      scoreA: 0,
      scoreB: 0,
      createdAt: new Date().toISOString(),
      currentQuestionIndex: -1
    };

    const createdMatch = await db.createMatch(match);

    return NextResponse.json({ 
      matchId: createdMatch.id,
      status: 'success',
      message: 'Match created successfully'
    });

  } catch (error) {
    console.error('Error creating match:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 