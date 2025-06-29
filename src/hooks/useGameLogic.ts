'use client';

import { useState, useEffect, useCallback } from 'react';
import { Match, Question } from '@/types';

interface GameLogicParams {
  match: Match | null;
  currentUserId: string | null;
  id: string;
  onTimeUp: () => void;
  onAnswerSelect: () => void;
  onBeep: () => void;
}

export function useGameLogic({
  match,
  currentUserId,
  id,
  onTimeUp,
  onAnswerSelect,
}: GameLogicParams) {
  const currentQuestion: Question | null = match?.questions[match?.currentQuestionIndex] || null;
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(24);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);

  const submitAnswer = useCallback(async (answerIndex: number, timeRemaining: number) => {
    if (hasAnswered && answerIndex !== -1) return;
    
    setHasAnswered(true);

    try {
      console.log('[ANSWER] Current user ID state:', currentUserId);
      console.log('[ANSWER] Submitting answer:', { answerIndex, timeRemaining, playerId: currentUserId });
      
      const response = await fetch('/api/match/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: id,
          questionId: currentQuestion?.id,
          selectedOption: answerIndex,
          timeRemaining,
          playerId: currentUserId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit answer');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setHasAnswered(false);
    }
  }, [hasAnswered, currentUserId, id, currentQuestion]);

  // Timer for current question
  useEffect(() => {
    if (match?.status === 'IN_PROGRESS' && currentQuestion && !hasAnswered) {
      setTimeLeft(24);
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          
          if (newTime <= 0) {
            onTimeUp();
            submitAnswer(-1, 0);
            return 0;
          }
          
          return newTime;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [match?.currentQuestionIndex, hasAnswered, match?.status]);

  // Reset answer state when question changes
  useEffect(() => {
    if (match?.currentQuestionIndex !== undefined) {
      console.log(`[QUESTION] Question changed to index ${match.currentQuestionIndex}`);
      setSelectedAnswer(null);
      setHasAnswered(false);
      setTimeLeft(24);
      setShowFeedback(false);
    }
  }, [match?.currentQuestionIndex]);
  
  const handleAnswerSelect = (answerIndex: number) => {
    if (hasAnswered) return;
    setSelectedAnswer(answerIndex);
    
    if (currentQuestion && answerIndex >= 0) {
      setShowFeedback(true);
      onAnswerSelect();
      
      setTimeout(() => {
        setShowFeedback(false);
      }, 2000);
    }
    
    submitAnswer(answerIndex, timeLeft);
  };
  
  const getCurrentPlayerAnswerStatus = () => {
    if (!match || !currentQuestion) return null;
    
    const currentQuestionAnswers = {
      playerA: match.answersA.filter(a => a.questionId === currentQuestion.id).length,
      playerB: match.answersB.filter(a => a.questionId === currentQuestion.id).length
    };
    
    return currentQuestionAnswers;
  };

  const answerStatus = getCurrentPlayerAnswerStatus();
  const waitingForOpponent = !!(hasAnswered && answerStatus && 
    (match?.playerB ? ((answerStatus.playerA > 0 && answerStatus.playerB === 0) || 
     (answerStatus.playerA === 0 && answerStatus.playerB > 0)) : false));

  return {
    currentQuestion,
    selectedAnswer,
    timeLeft,
    hasAnswered,
    showFeedback,
    handleAnswerSelect,
    waitingForOpponent,
  };
} 