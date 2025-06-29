import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const API_SECRET_KEY = process.env.API_SECRET_KEY;

if (!API_SECRET_KEY) {
  throw new Error('API_SECRET_KEY is not set in environment variables');
}

export async function POST(req: Request) {
  // 1. Authenticate the request
  const secret = req.headers.get('x-api-secret');
  if (secret !== API_SECRET_KEY) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. Parse the request body for the difficulty
    const { difficulty = 'medium' } = await req.json();

    if (!difficulty) {
      return NextResponse.json({ message: 'Difficulty is required' }, { status: 400 });
    }

    // 3. Call the new DB function to clear the questions
    const deletedCount = await db.clearQuestions(difficulty);

    if (deletedCount > 0) {
      return NextResponse.json(
        { 
          message: `Successfully cleared question set for difficulty: ${difficulty}.`,
          deletedCount,
        }, 
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { 
          message: `Question set for difficulty '${difficulty}' not found or already empty.`,
        }, 
        { status: 200 }
      );
    }

  } catch (error) {
    console.error('Error in clear questions endpoint:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
        { message: 'An internal server error occurred.', error: errorMessage }, 
        { status: 500 }
    );
  }
} 