import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
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
    const { nft, flowAddress } = body; // Now expecting the full NFT object and Flow address

    console.log('=== MATCH CREATE DEBUG ===');
    console.log('Full request body:', JSON.stringify(body, null, 2));
    console.log('Received NFT data for match creation:', JSON.stringify(nft, null, 2));
    console.log('Received Flow address for Player A:', flowAddress);
    console.log('Flow address type:', typeof flowAddress);
    console.log('Flow address length:', flowAddress?.length);

    if (!nft || !nft.id || !nft.name || !nft.image || !nft.rarity || !nft.collection) {
      return NextResponse.json({ error: 'A complete NFT object is required to create a match.' }, { status: 400 });
    }

    if (!flowAddress) {
      return NextResponse.json({ error: 'Flow address is required' }, { status: 400 });
    }

    if (!nft.dapp?.id) {
      console.warn('Missing dapp.id in NFT data, will use fallback:', nft);
      // Don't fail - we'll use a fallback dappID
    }

    // Convert the real Dapper moment to our NFT format
    const nftData: NFT = {
      id: nft.id.toString(), // Convert to string for consistency
      name: nft.title || nft.name || `Token #${nft.id}`,
      image: nft.imageURL || nft.image || '/testImage.jpg',
      rarity: nft.rarity || 'Common',
      collection: nft.collection,
      // Add fields needed for NFT transfer
      contract: nft.contract || nft.tokenContractData?.contract || 'A.877931736ee77cff.TopShot',
      dappID: nft.dapp?.id || 'ad3260ba-a87c-4359-a8b0-def2cc36310b', // Fallback to NBA Top Shot dappID
      serialNumber: nft.serialNumber ? parseInt(nft.serialNumber) : undefined
    };

    console.log('Converted NFT data for storage:', JSON.stringify(nftData, null, 2));

    const questions = await db.getRandomQuestions(5, 'medium');
    if (questions.length < 5) {
      console.error('Not enough questions in the database to start a match.');
      return NextResponse.json(
        { error: 'Could not start match: not enough questions available.' }, 
        { status: 500 }
      );
    }

    const matchId = uuidv4();

    const match: Match = {
      id: matchId,
      status: 'PENDING',
      playerA: {
        id: session.user.sub,
        name: session.user.name || session.user.email || 'Player 1',
        avatar: session.user.picture,
        flowAddress: flowAddress
      },
      nftA: nftData,
      questions: questions,
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