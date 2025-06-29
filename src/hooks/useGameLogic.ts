'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Match, Question } from '@/types';

interface GameLogicParams {
  match: Match | null;
  currentUserId: string | null;
  id: string;
  onTimeUp: () => void;
  onAnswerSelect: () => void;
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
  
  // Timer state management - completely decoupled from match updates
  const [timerState, setTimerState] = useState<{
    isRunning: boolean;
    questionId: string | null;
    startTime: number | null;
  }>({
    isRunning: false,
    questionId: null,
    startTime: null,
  });
  
  // Stable refs for timer callbacks
  const onTimeUpRef = useRef(onTimeUp);
  const submitAnswerRef = useRef<((answerIndex: number, timeRemaining: number) => Promise<void>) | null>(null);
  
  // Update refs when callbacks change
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  const submitAnswer = useCallback(async (answerIndex: number, timeRemaining: number) => {
    if (hasAnswered && answerIndex !== -1) return;
    
    setHasAnswered(true);

    try {
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
  }, [hasAnswered, currentUserId, id, currentQuestion?.id]);

  // Update submit answer ref
  useEffect(() => {
    submitAnswerRef.current = submitAnswer;
  }, [submitAnswer]);

  // Timer effect - completely independent of match state
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (timerState.isRunning && timerState.startTime) {
      intervalId = setInterval(() => {
        const elapsed = Date.now() - timerState.startTime!;
        const remaining = Math.max(0, 24 - Math.floor(elapsed / 1000));
        
        setTimeLeft(remaining);
        
        if (remaining <= 0) {
          setTimerState(prev => ({ ...prev, isRunning: false }));
          onTimeUpRef.current();
          submitAnswerRef.current?.(-1, 0);
        }
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [timerState.isRunning, timerState.startTime, timerState.questionId]);

  // Question change detection - start timer for new questions
  useEffect(() => {
    if (match?.status === 'IN_PROGRESS' && 
        currentQuestion && 
        !hasAnswered && 
        currentQuestion.id !== timerState.questionId) {
      
      setTimeLeft(24);
      setTimerState({
        isRunning: true,
        questionId: currentQuestion.id,
        startTime: Date.now(),
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match?.status, currentQuestion?.id, hasAnswered, timerState.questionId]);

  // Stop timer when answered
  useEffect(() => {
    if (hasAnswered && timerState.isRunning) {
      setTimerState(prev => ({ ...prev, isRunning: false }));
    }
  }, [hasAnswered, timerState.isRunning]);

  // Reset answer state when question changes
  useEffect(() => {
    if (match?.currentQuestionIndex !== undefined) {
      setSelectedAnswer(null);
      setHasAnswered(false);
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