import { NextResponse } from 'next/server';
import { generateTriviaQuestions } from '@/lib/ai';
import { db } from '@/lib/db';

const
 

API_SECRET_KEY = process.env.API_SECRET_KEY;

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
    // 2. Parse the request body
    const { 
      topic = 'NBA History', 
      difficulty = 'medium', 
      count = 10 
    } = await req.json();

    // 3. Generate questions using the AI service
    const questions = await generateTriviaQuestions(topic, difficulty, count);

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { message: 'Failed to generate questions from AI.' },
        { status: 500 }
      );
    }

    // 4. Save the questions to the database
    const addedCount = await db.addQuestions(questions, difficulty);

    return NextResponse.json(
      { 
        message: 'Successfully generated and stored questions.',
        addedCount,
        difficulty,
        generatedQuestions: questions,
      }, 
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in question generation endpoint:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
        { message: 'An internal server error occurred.', error: errorMessage }, 
        { status: 500 }
    );
  }
} 