'use client';

import { useState, useEffect, useRef } from 'react';
import { useSound } from '@/hooks/useSound';
import { useMatchState } from '@/hooks/useMatchState';
import { useGameLogic } from '@/hooks/useGameLogic';
import LoadingScreen from '@/components/match/LoadingScreen';
import ErrorScreen from '@/components/match/ErrorScreen';
import MatchLobby from '@/components/match/MatchLobby';
import MatchReady from '@/components/match/MatchReady';
import GameInProgress from '@/components/match/GameInProgress';
import { GameFinishedScreen } from '@/components/match/GameFinishedScreen';
import { LogoIntro } from '@/components/LogoIntro';

interface MatchClientProps {
  id: string;
}

export default function MatchClient({ id }: MatchClientProps) {
  const [soundsEnabled, setSoundsEnabled] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [introShown, setIntroShown] = useState(false);
  const audioInitializedRef = useRef(false);
  const cheerPlayedRef = useRef(false);
  
  const cheerSound = useSound('/sfx/cheer.mp3', { debounceMs: 0 });
  const buzzerSound = useSound('/sfx/buzzer.mp3', { debounceMs: 0 });
  const swishSound = useSound('/sfx/swish.mp3', { debounceMs: 0 });

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const response = await fetch('/auth/profile');
        if (response.ok) {
          const userData = await response.json();
          setCurrentUserId(userData.sub);
        }
      } catch (error) {
        console.error('Failed to get current user:', error);
      }
    };
    getCurrentUser();
  }, []);

  // Initialize audio context properly
  const initializeAudio = async () => {
    if (!audioInitializedRef.current) {
      try {
        // Create and play a silent audio to initialize context
        const audio = new Audio();
        audio.volume = 0.01;
        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDuJ0fPTgjMGHm7A7+OZURE';
        await audio.play();
        audioInitializedRef.current = true;
        setSoundsEnabled(true);
      } catch (error) {
        console.warn('Could not initialize audio context:', error);
        setSoundsEnabled(true);
      }
    }
  };

  const {
    match,
    error,
    connectionStatus,
    currentUserId: matchCurrentUserId,
    reconnectAttempts,
    maxReconnectAttempts,
  } = useMatchState(id, {
    onMatchFinished: () => {
      // Match finished callback - cheer sound handled in useEffect
    },
  });

  // Handle cheer sound when match finishes
  useEffect(() => {
    if (match?.status === 'FINISHED' && soundsEnabled && currentUserId && !cheerPlayedRef.current) {
      const isPlayerA = match.playerA.id === currentUserId;
      const isWinner = (isPlayerA && match.winner === 'A') || (!isPlayerA && match.winner === 'B');
      
      if (isWinner) {
        cheerPlayedRef.current = true;
        setTimeout(() => {
          cheerSound.play().catch(err => console.warn('Cheer sound failed:', err));
        }, 500);
      }
    }
  }, [match?.status, soundsEnabled, currentUserId, cheerSound, match?.playerA.id, match?.playerB?.id, match?.winner]);

  // Reset cheer played flag when match changes or restarts
  useEffect(() => {
    if (match?.status !== 'FINISHED') {
      cheerPlayedRef.current = false;
    }
  }, [match?.status]);

  // Use currentUserId from state if matchCurrentUserId is not available yet
  const userId = matchCurrentUserId || currentUserId;

  const {
    currentQuestion,
    selectedAnswer,
    timeLeft,
    hasAnswered,
    showFeedback,
    handleAnswerSelect,
    waitingForOpponent,
  } = useGameLogic({
    match,
    currentUserId: userId,
    id,
    onTimeUp: () => {
      // Always play buzzer when time runs out - it's a critical game event
      buzzerSound.play().catch(err => console.warn('Buzzer sound failed:', err));
    },
    onAnswerSelect: () => {
      if (soundsEnabled) {
        swishSound.play().catch(err => console.warn('Swish sound failed:', err));
      }
    },
  });

  const startGame = async () => {
    await initializeAudio();
    try {
      const response = await fetch('/api/match/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: id })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Start game failed:', response.status, errorData);
        throw new Error(errorData.error || `Failed to start game (${response.status})`);
      }
      
      await response.json();
    } catch (err) {
      console.error('Error starting game:', err);
    }
  };

  const handleAnswerClick = (answerIndex: number) => {
    initializeAudio();
    handleAnswerSelect(answerIndex);
  };

  const handleIntroComplete = () => {
    setIntroShown(true);
  };

  if (error && !match) {
    return <ErrorScreen error={error} />;
  }

  if (!match) {
    return (
      <LoadingScreen 
        connectionStatus={connectionStatus}
        reconnectAttempts={reconnectAttempts}
        maxReconnectAttempts={maxReconnectAttempts}
      />
    );
  }

  switch (match.status) {
    case 'PENDING':
      return <MatchLobby match={match} />;
    case 'READY':
      return <MatchReady match={match} currentUserId={userId} onStartGame={startGame} />;
    case 'INTRO':
      // Only show intro once
      if (!introShown) {
        return <LogoIntro onComplete={handleIntroComplete} playSound={soundsEnabled} />;
      }
      // If intro was already shown, show loading while waiting for IN_PROGRESS
      return (
        <LoadingScreen 
          connectionStatus={connectionStatus}
          reconnectAttempts={reconnectAttempts}
          maxReconnectAttempts={maxReconnectAttempts}
        />
      );
    case 'IN_PROGRESS':
      if (currentQuestion) {
        return (
          <GameInProgress
            match={match}
            currentUserId={userId}
            currentQuestion={currentQuestion}
            timeLeft={timeLeft}
            hasAnswered={hasAnswered}
            onAnswerSelect={handleAnswerClick}
            selectedAnswer={selectedAnswer}
            showFeedback={showFeedback}
            waitingForOpponent={waitingForOpponent}
            onTimeUp={() => {}} // Timer logic is in useGameLogic hook
          />
        );
      }
      break; // Fall through to loading if no current question
    case 'FINISHED':
      const winner = match.winner === 'A' ? match.playerA : 
                     match.winner === 'B' ? (match.playerB || null) : null;
      
      return (
        <GameFinishedScreen 
          match={match} 
          winner={winner}
          currentUserId={userId}
        />
      );
  }

  // Fallback for any other state, or if IN_PROGRESS but no currentQuestion
  return (
    <LoadingScreen 
      connectionStatus={connectionStatus}
      reconnectAttempts={reconnectAttempts}
      maxReconnectAttempts={maxReconnectAttempts}
    />
  );
} 