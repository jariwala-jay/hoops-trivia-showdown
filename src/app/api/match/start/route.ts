import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matchId } = body;

    if (!matchId) {
      return NextResponse.json({ error: 'Match ID is required' }, { status: 400 });
    }

    const match = await db.getMatch(matchId);
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (match.status !== 'READY') {
      return NextResponse.json({ error: 'Match is not ready to start' }, { status: 400 });
    }

    if (!match.playerB) {
      return NextResponse.json({ error: 'Waiting for second player' }, { status: 400 });
    }

    // Start the match
    const updatedMatch = await db.updateMatch(matchId, {
      status: 'IN_PROGRESS' as const,
      startedAt: new Date().toISOString(),
      currentQuestionIndex: 0
    });

    if (!updatedMatch) {
      return NextResponse.json({ error: 'Failed to start match' }, { status: 500 });
    }

    return NextResponse.json({ 
      status: 'success',
      message: 'Match started successfully',
      match: updatedMatch
    });

  } catch (error) {
    console.error('Error starting match:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 