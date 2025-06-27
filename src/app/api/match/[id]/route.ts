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
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    return NextResponse.json({ match });

  } catch (error) {
    console.error('Error fetching match:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 