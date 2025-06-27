import { NextRequest, NextResponse } from 'next/server';
import { db, calculateScore } from '@/lib/db';
import { PlayerAnswer } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      matchId, 
      questionId, 
      selectedOption, 
      timeRemaining,
      playerId
    } = body;

    if (!matchId || !questionId || selectedOption === undefined || timeRemaining === undefined) {
      return NextResponse.json({ 
        error: 'Match ID, question ID, selected option, and time remaining are required' 
      }, { status: 400 });
    }

    const match = await db.getMatch(matchId);
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Find the question
    const question = match.questions.find(q => q.id === questionId);
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Check if answer is correct
    const isCorrect = selectedOption === question.correctAnswer;
    const points = calculateScore(isCorrect, timeRemaining, question.timeLimit);

    // Create player answer
    const playerAnswer: PlayerAnswer = {
      questionId,
      selectedOption,
      timeRemaining,
      isCorrect,
      points
    };

    // Determine which player is answering based on current answers
    // For now, we'll use a simple approach - if playerId is provided, use it
    // Otherwise, determine based on who has answered fewer questions
    let isPlayerA = false;
    let isPlayerB = false;

    if (playerId) {
      isPlayerA = match.playerA.id === playerId;
      isPlayerB = match.playerB?.id === playerId;
      
      if (!isPlayerA && !isPlayerB) {
        return NextResponse.json({ error: 'Player not found in match' }, { status: 404 });
      }
    } else {
      // Determine player based on who has answered fewer questions for current question
      const currentQuestionAnswers = {
        playerA: match.answersA.filter(a => a.questionId === questionId).length,
        playerB: match.answersB.filter(a => a.questionId === questionId).length
      };

      if (currentQuestionAnswers.playerA === 0) {
        isPlayerA = true;
      } else if (currentQuestionAnswers.playerB === 0) {
        isPlayerB = true;
      } else {
        return NextResponse.json({ error: 'Both players have already answered this question' }, { status: 400 });
      }
    }

    // Update match with answer
    let updatedMatch;
    if (isPlayerA) {
      const updatedAnswersA = [...match.answersA, playerAnswer];
      const newScoreA = match.scoreA + points;
      updatedMatch = await db.updateMatch(matchId, {
        answersA: updatedAnswersA,
        scoreA: newScoreA
      });
    } else {
      const updatedAnswersB = [...match.answersB, playerAnswer];
      const newScoreB = match.scoreB + points;
      updatedMatch = await db.updateMatch(matchId, {
        answersB: updatedAnswersB,
        scoreB: newScoreB
      });
    }

    if (!updatedMatch) {
      return NextResponse.json({ error: 'Failed to update match' }, { status: 500 });
    }

    // Check if both players have answered the current question
    const currentQuestionId = match.questions[match.currentQuestionIndex]?.id;
    const currentQuestionAnswers = {
      playerA: updatedMatch.answersA.filter(a => a.questionId === currentQuestionId).length,
      playerB: updatedMatch.answersB.filter(a => a.questionId === currentQuestionId).length
    };

    // If both players have answered the current question, move to next question
    if (currentQuestionAnswers.playerA > 0 && currentQuestionAnswers.playerB > 0) {
      const nextQuestionIndex = match.currentQuestionIndex + 1;
      
      if (nextQuestionIndex >= match.questions.length) {
        // Game is finished, determine winner
        let winner: 'A' | 'B' | 'TIE';
        if (updatedMatch.scoreA > updatedMatch.scoreB) {
          winner = 'A';
        } else if (updatedMatch.scoreB > updatedMatch.scoreA) {
          winner = 'B';
        } else {
          winner = 'TIE';
        }

        updatedMatch = await db.updateMatch(matchId, {
          status: 'FINISHED',
          winner,
          finishedAt: new Date().toISOString()
        });
      } else {
        // Move to next question
        updatedMatch = await db.updateMatch(matchId, {
          currentQuestionIndex: nextQuestionIndex
        });
      }
    }

    return NextResponse.json({ 
      status: 'success',
      isCorrect,
      points,
      correctAnswer: question.correctAnswer,
      match: updatedMatch
    });

  } catch (error) {
    console.error('Error submitting answer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 