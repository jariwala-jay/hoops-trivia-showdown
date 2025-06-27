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

  // Fetch match data
  const { data, error } = useSWR(
    id ? `/api/match/${id}` : null,
    fetcher,
    { refreshInterval: 2000 }
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
      const response = await fetch('/api/match/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: id })
      });
      
      if (!response.ok) {
        throw new Error('Failed to start game');
      }
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  const submitAnswer = async (answerIndex: number, timeRemaining: number) => {
    if (hasAnswered) return;
    
    setHasAnswered(true);
    
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
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (hasAnswered) return;
    setSelectedAnswer(answerIndex);
    submitAnswer(answerIndex, timeLeft);
  };

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

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 mb-8">
              <h3 className="text-2xl font-bold text-white mb-4">Ready to Battle!</h3>
              <p className="text-white mb-6">Both players are ready. Click the button below to start the trivia showdown!</p>
              <button
                onClick={startGame}
                className="bg-orange-500 text-white px-8 py-4 rounded-xl font-bold text-xl hover:bg-orange-400 transition-all"
              >
                🏀 Start Trivia Battle!
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Match in progress - show trivia
  if (match.status === 'IN_PROGRESS' && currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-600">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header with scores and timer */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white text-center">
                <h3 className="font-bold">{match.playerA.name}</h3>
                <p className="text-2xl font-bold">{match.scoreA}</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white text-center">
                <div className="text-4xl font-bold mb-2">{timeLeft}</div>
                <div className="text-sm">seconds left</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white text-center">
                <h3 className="font-bold">{match.playerB?.name}</h3>
                <p className="text-2xl font-bold">{match.scoreB}</p>
              </div>
            </div>

            {/* Question */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 mb-8">
              <div className="text-center mb-6">
                <p className="text-white text-sm mb-2">Question {match.currentQuestionIndex + 1} of {match.questions.length}</p>
                <h2 className="text-2xl font-bold text-white">{currentQuestion.question}</h2>
              </div>

              {/* Answer options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={hasAnswered}
                    className={`p-4 rounded-lg font-semibold text-left transition-all ${
                      hasAnswered
                        ? selectedAnswer === index
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-400 text-gray-700 cursor-not-allowed'
                        : 'bg-white text-gray-800 hover:bg-blue-100'
                    }`}
                  >
                    <span className="font-bold mr-2">{String.fromCharCode(65 + index)}.</span>
                    {option}
                  </button>
                ))}
              </div>

              {hasAnswered && (
                <div className="text-center mt-6 text-white">
                  <p className="text-lg">Answer submitted! Waiting for next question...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Match finished or other states
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-blue-600">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-white mb-8">Match Status: {match.status}</h1>
          
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
              <p className="text-2xl font-bold mt-2">Score: {match.scoreA}</p>
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
                <p className="text-2xl font-bold mt-2">Score: {match.scoreB}</p>
              </div>
            )}
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-4">Match Status: {match.status}</h3>
            {match.status === 'FINISHED' && (
              <div>
                <p className="text-2xl font-bold text-white mb-4">
                  Winner: {match.winner === 'TIE' ? 'It&apos;s a Tie!' : 
                           match.winner === 'A' ? match.playerA.name : 
                           match.playerB!.name}
                </p>
                <div className="text-6xl mb-4">
                  {match.winner === 'TIE' ? '🤝' : '🏆'}
                </div>
              </div>
            )}
          </div>

          <div className="space-x-4">
            <Link
              href="/"
              className="bg-white text-green-600 px-8 py-4 rounded-xl font-bold text-xl hover:bg-gray-100 transition-all inline-block"
            >
              Back to Home
            </Link>
            <Link
              href="/create"
              className="bg-green-500 text-white px-8 py-4 rounded-xl font-bold text-xl hover:bg-green-400 transition-all inline-block"
            >
              Play Again
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 