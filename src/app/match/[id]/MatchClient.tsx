'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { useState, useEffect } from 'react';
import { Match, Question } from '@/types';

interface MatchClientProps {
  id: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function MatchClient({ id }: MatchClientProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(24);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);

  // Fetch match data with smart polling
  const { data, error, mutate } = useSWR(
    id ? `/api/match/${id}` : null,
    fetcher,
    { 
      refreshInterval: (data) => {
        const match = data?.match;
        // Fast polling during active gameplay, slower when waiting
        if (match?.status === 'IN_PROGRESS') return 500; // 0.5 seconds during game
        if (match?.status === 'READY') return 1000; // 1 second when ready to start
        return 2000; // 2 seconds for pending/finished states
      },
      refreshWhenHidden: false,
      refreshWhenOffline: false,
      revalidateOnFocus: true,
      dedupingInterval: 100, // Prevent duplicate requests
      errorRetryInterval: 1000,
      errorRetryCount: 3
    }
  );

  const match: Match | null = data?.match || null;
  const currentQuestion: Question | null = match?.questions[match?.currentQuestionIndex] || null;

  // Timer for current question
  useEffect(() => {
    if (match?.status === 'IN_PROGRESS' && currentQuestion && !hasAnswered) {
      setTimeLeft(24);
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setHasAnswered(true);
            // Auto-submit when time runs out
            submitAnswer(-1, 0); // -1 indicates no answer selected
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [match?.currentQuestionIndex, hasAnswered, currentQuestion]);

  // Reset answer state when question changes
  useEffect(() => {
    if (match?.currentQuestionIndex !== undefined) {
      setSelectedAnswer(null);
      setHasAnswered(false);
      setTimeLeft(24);
    }
  }, [match?.currentQuestionIndex]);

  const startGame = async () => {
    try {
      // Optimistic UI update
      mutate();
      
      const response = await fetch('/api/match/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: id })
      });
      
      if (!response.ok) {
        throw new Error('Failed to start game');
      }
      
      // Force immediate refresh
      mutate();
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  const submitAnswer = async (answerIndex: number, timeRemaining: number) => {
    if (hasAnswered && answerIndex !== -1) return; // Allow auto-submit on timeout
    
    setHasAnswered(true);
    
    // Immediate optimistic update
    mutate();
    
    try {
      const response = await fetch('/api/match/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: id,
          questionId: currentQuestion?.id,
          selectedOption: answerIndex,
          timeRemaining
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit answer');
      }
      
      // Force refresh after successful submission
      mutate();
    } catch (error) {
      console.error('Error submitting answer:', error);
      // Reset state on error
      setHasAnswered(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (hasAnswered) return;
    setSelectedAnswer(answerIndex);
    submitAnswer(answerIndex, timeLeft);
  };

  // Get current player's answer status
  const getCurrentPlayerAnswerStatus = () => {
    if (!match || !currentQuestion) return null;
    
    const currentQuestionAnswers = {
      playerA: match.answersA.filter(a => a.questionId === currentQuestion.id).length,
      playerB: match.answersB.filter(a => a.questionId === currentQuestion.id).length
    };
    
    return currentQuestionAnswers;
  };

  const answerStatus = getCurrentPlayerAnswerStatus();
  const waitingForOpponent = hasAnswered && answerStatus && 
    ((answerStatus.playerA > 0 && answerStatus.playerB === 0) || 
     (answerStatus.playerA === 0 && answerStatus.playerB > 0));

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">Match Not Found</h1>
          <p className="text-xl mb-8">The match you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/" className="bg-white text-red-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading match...</p>
        </div>
      </div>
    );
  }

  // Match lobby (waiting for opponent)
  if (match.status === 'PENDING') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 to-red-600">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-white mb-8">Waiting for Opponent...</h1>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 mb-8">
              <p className="text-white text-xl mb-6">Share this Match ID with your opponent:</p>
              <div className="bg-black/20 rounded-lg p-4 font-mono text-white text-lg break-all">
                {match.id}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(match.id);
                  alert('Match ID copied to clipboard!');
                }}
                className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-400"
              >
                Copy Match ID
              </button>
            </div>

            <div className="animate-pulse">
              <div className="text-6xl mb-4">⏳</div>
              <p className="text-white text-xl">Waiting for player to join...</p>
              <div className="mt-4 flex justify-center">
                <div className="animate-bounce text-orange-300">●</div>
                <div className="animate-bounce text-orange-300 mx-1" style={{animationDelay: '0.1s'}}>●</div>
                <div className="animate-bounce text-orange-300" style={{animationDelay: '0.2s'}}>●</div>
              </div>
            </div>

            <div className="mt-8">
              <Link href="/" className="text-white hover:text-orange-200 transition-colors">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Match ready - show start button
  if (match.status === 'READY') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 to-blue-600">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-white mb-8">Match Ready!</h1>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
                <h2 className="text-2xl font-bold mb-4">{match.playerA.name}</h2>
                <div className="w-32 h-40 mx-auto mb-4 rounded-lg overflow-hidden">
                  <img
                    src={match.nftA.image}
                    alt={match.nftA.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p>{match.nftA.name}</p>
              </div>

              {match.playerB && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
                  <h2 className="text-2xl font-bold mb-4">{match.playerB.name}</h2>
                  <div className="w-32 h-40 mx-auto mb-4 rounded-lg overflow-hidden">
                    <img
                      src={match.nftB!.image}
                      alt={match.nftB!.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p>{match.nftB!.name}</p>
                </div>
              )}
            </div>

            <button
              onClick={startGame}
              className="bg-white text-green-600 px-8 py-4 rounded-lg font-bold text-xl hover:bg-gray-100 transform hover:scale-105 transition-all"
            >
              Start Game! 🏀
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Game in progress
  if (match.status === 'IN_PROGRESS' && currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-800">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Game Header */}
            <div className="flex justify-between items-center mb-8 text-white">
              <div className="text-center">
                <h3 className="text-lg font-bold">{match.playerA.name}</h3>
                <div className="text-3xl font-bold text-orange-400">{match.scoreA}</div>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-gray-300">Question {(match.currentQuestionIndex || 0) + 1} of {match.questions.length}</div>
                <div className={`text-6xl font-bold ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                  {timeLeft}
                </div>
                <div className="text-sm text-gray-300">seconds</div>
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-bold">{match.playerB?.name}</h3>
                <div className="text-3xl font-bold text-blue-400">{match.scoreB}</div>
              </div>
            </div>

            {/* Waiting for opponent indicator */}
            {waitingForOpponent && (
              <div className="text-center mb-6">
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                    <span className="text-yellow-200">Waiting for opponent&apos;s answer...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Question */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 mb-8">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">
                {currentQuestion.question}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={hasAnswered}
                    className={`p-4 rounded-lg text-left transition-all duration-200 ${
                      selectedAnswer === index
                        ? 'bg-orange-500 text-white transform scale-105'
                        : hasAnswered
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-white/20 text-white hover:bg-white/30 hover:transform hover:scale-105'
                    }`}
                  >
                    <span className="font-bold mr-2">{String.fromCharCode(65 + index)}.</span>
                    {option}
                  </button>
                ))}
              </div>
              
              {hasAnswered && (
                <div className="text-center mt-6">
                  <div className="text-green-400 font-bold">
                    ✓ Answer submitted!
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Game finished
  if (match.status === 'FINISHED') {
    const winner = match.winner === 'A' ? match.playerA : 
                   match.winner === 'B' ? match.playerB : null;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-500 to-orange-600">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-6xl font-bold text-white mb-8">
              {match.winner === 'TIE' ? 'It&apos;s a Tie!' : 'Game Over!'}
            </h1>
            
            {winner && (
              <div className="mb-8">
                <h2 className="text-4xl font-bold text-white mb-4">
                  🏆 {winner.name} Wins!
                </h2>
                <p className="text-xl text-white/80">
                  Congratulations! You win both NFTs!
                </p>
              </div>
            )}
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
                <h3 className="text-2xl font-bold mb-4">{match.playerA.name}</h3>
                <div className="text-4xl font-bold text-orange-400 mb-4">{match.scoreA}</div>
                <div className="w-32 h-40 mx-auto rounded-lg overflow-hidden">
                  <img
                    src={match.nftA.image}
                    alt={match.nftA.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="mt-2">{match.nftA.name}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
                <h3 className="text-2xl font-bold mb-4">{match.playerB?.name}</h3>
                <div className="text-4xl font-bold text-blue-400 mb-4">{match.scoreB}</div>
                <div className="w-32 h-40 mx-auto rounded-lg overflow-hidden">
                  <img
                    src={match.nftB!.image}
                    alt={match.nftB!.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="mt-2">{match.nftB!.name}</p>
              </div>
            </div>

            <Link
              href="/"
              className="bg-white text-orange-600 px-8 py-4 rounded-lg font-bold text-xl hover:bg-gray-100 transform hover:scale-105 transition-all"
            >
              Play Again
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
} 