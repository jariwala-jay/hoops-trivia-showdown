import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Match ID is required' }, { status: 400 });
    }

    const match = await db.getMatch(id);
    if (!match) {
      return NextResponse.json({ 
        error: 'Match not found',
        message: 'The match you are looking for does not exist or may have been deleted.',
        matchId: id
      }, { status: 404 });
    }

    // Add some debugging info for finished matches
    const responseData = {
      match,
      debug: {
        status: match.status,
        finishedAt: match.finishedAt,
        winner: match.winner,
        timestamp: new Date().toISOString()
      }
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error fetching match:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'An error occurred while fetching the match data.'
    }, { status: 500 });
  }
} 