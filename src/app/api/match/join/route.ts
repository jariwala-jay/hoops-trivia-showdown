import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import { auth0 } from '@/lib/auth0';
import { NFT } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user's session
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { matchId, nft, flowAddress } = body; // Now expecting the full NFT object and Flow address

    if (!matchId || !nft || !nft.id) {
      return NextResponse.json({ 
        error: 'Match ID and NFT data are required' 
      }, { status: 400 });
    }

    if (!flowAddress) {
      return NextResponse.json({ error: 'Flow address is required' }, { status: 400 });
    }

    if (!nft.dapp?.id) {
      console.warn('Missing dapp.id in NFT data, will use fallback:', nft);
      // Don't fail - we'll use a fallback dappID
    }

    const match = await db.getMatch(matchId);
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (match.status !== 'PENDING') {
      return NextResponse.json({ 
        error: 'Match is not available for joining' 
      }, { status: 400 });
    }

    if (match.playerB) {
      return NextResponse.json({ 
        error: 'Match is already full' 
      }, { status: 400 });
    }

    // Convert the real Dapper moment to our NFT format
    const nftData: NFT = {
      id: nft.id.toString(), // Convert to string for consistency
      name: nft.title || nft.name || `Token #${nft.id}`,
      image: nft.imageURL || nft.image || '/testImage.jpg',
      rarity: nft.rarity || 'Common',
      collection: nft.dapp?.name || 'NBA Top Shot',
      // Add fields needed for NFT transfer
      contract: nft.contract || nft.tokenContractData?.contract || 'A.877931736ee77cff.TopShot',
      dappID: nft.dapp?.id || 'ad3260ba-a87c-4359-a8b0-def2cc36310b', // Fallback to NBA Top Shot dappID
      serialNumber: nft.serialNumber ? parseInt(nft.serialNumber) : undefined
    };

    // Validate that NFT rarities match
    if (match.nftA.rarity !== nftData.rarity) {
      return NextResponse.json({ 
        error: `Rarity mismatch! This match requires a ${match.nftA.rarity} NFT, but you selected a ${nftData.rarity} NFT.`,
        requiredRarity: match.nftA.rarity,
        providedRarity: nftData.rarity
      }, { status: 400 });
    }

    // Flow address is now passed from the client

    const updatedMatch = await db.updateMatch(matchId, {
      playerB: {
        id: session.user.sub || uuidv4(),
        name: session.user.name || session.user.email || 'Player 2',
        avatar: session.user.picture,
        flowAddress: flowAddress
      },
      nftB: nftData,
      status: 'READY',
      currentQuestionIndex: 0
    });

    if (!updatedMatch) {
      return NextResponse.json({ error: 'Failed to join match' }, { status: 500 });
    }

    return NextResponse.json({ 
      status: 'success',
      message: 'Successfully joined match',
      match: updatedMatch
    });

  } catch (error) {
    console.error('Error joining match:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 