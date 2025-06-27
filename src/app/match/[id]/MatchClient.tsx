'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Match, Question, Player } from '@/types';
import Image from 'next/image';

interface MatchClientProps {
  id: string;
}

// Component for the finished game screen with NFT transfer functionality
function GameFinishedScreen({ match, winner }: { match: Match; winner: Player | null }) {
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferStatus, setTransferStatus] = useState<string | null>(null);
  const [transferError, setTransferError] = useState<string | null>(null);

  // Check transfer status on load
  useEffect(() => {
    if (match.winner !== 'TIE') {
      checkTransferStatus();
    }
  }, [match.id, match.winner]);

  const checkTransferStatus = async () => {
    try {
      const response = await fetch(`/api/match/transfer-nft?matchId=${match.id}`);
      if (response.ok) {
        const data = await response.json();
        setTransferStatus(data.transferStatus);
        if (data.transferError) {
          setTransferError(data.transferError);
        }
      }
    } catch (error) {
      console.error('Error checking transfer status:', error);
    }
  };

  const handleRetryTransfer = async () => {
    setIsTransferring(true);
    setTransferError(null);

    try {
      const response = await fetch('/api/match/transfer-nft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matchId: match.id }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setTransferStatus('COMPLETED');
        setTransferError(null);
      } else {
        setTransferError(data.error || 'Transfer failed');
        setTransferStatus('FAILED');
      }
    } catch (error) {
      setTransferError(error instanceof Error ? error.message : 'Unknown error');
      setTransferStatus('FAILED');
    } finally {
      setIsTransferring(false);
    }
  };

  const renderTransferStatus = () => {
    if (match.winner === 'TIE') {
      return (
        <div className="mb-8">
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="text-blue-400">🤝</div>
              <span className="text-blue-200">No NFT transfers - each player keeps their NFT!</span>
            </div>
          </div>
        </div>
      );
    }

    switch (transferStatus) {
      case 'COMPLETED':
        return (
          <div className="mb-8">
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2">
                <div className="text-green-400">✅</div>
                <span className="text-green-200">NFT transfer completed successfully!</span>
              </div>
            </div>
          </div>
        );

      case 'IN_PROGRESS':
        return (
          <div className="mb-8">
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                <span className="text-yellow-200">Transferring NFTs...</span>
              </div>
            </div>
          </div>
        );

      case 'FAILED':
        return (
          <div className="mb-8">
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div className="text-red-400">⚠️</div>
                  <span className="text-red-200">NFT transfer failed</span>
                </div>
                {transferError && (
                  <p className="text-red-300 text-sm mb-3">{transferError}</p>
                )}
                <button
                  onClick={handleRetryTransfer}
                  disabled={isTransferring}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-400 disabled:opacity-50"
                >
                  {isTransferring ? 'Retrying...' : 'Retry Transfer'}
                </button>
              </div>
            </div>
          </div>
        );

      case 'PENDING':
      default:
        return (
          <div className="mb-8">
            <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div className="text-orange-400">⏳</div>
                  <span className="text-orange-200">NFT transfer pending...</span>
                </div>
                <p className="text-orange-300 text-sm mb-3">
                  The system is preparing to transfer the NFTs. This may take a few moments.
                </p>
                <button
                  onClick={checkTransferStatus}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-400"
                >
                  Check Status
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

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

          {/* NFT Transfer Status */}
          {renderTransferStatus()}
          
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
              {match.winner === 'B' && transferStatus === 'COMPLETED' && (
                <div className="mt-2 text-red-400 text-sm">
                  ➡️ Transferred to {match.playerB?.name}
                </div>
              )}
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
              {match.winner === 'A' && transferStatus === 'COMPLETED' && (
                <div className="mt-2 text-red-400 text-sm">
                  ➡️ Transferred to {match.playerA.name}
                </div>
              )}
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

export default function MatchClient({ id }: MatchClientProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(24);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [matchData, setMatchData] = useState<Match | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [finishedMatchData, setFinishedMatchData] = useState<Match | null>(null); // Persist finished match data
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 3;
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Function to fetch match data as fallback
  const fetchMatchData = useCallback(async () => {
    try {
      const response = await fetch(`/api/match/${id}`);
      if (response.ok) {
        const data = await response.json();
        return data.match;
      }
      return null;
    } catch (error) {
      console.error('Error fetching match data:', error);
      return null;
    }
  }, [id]);

  // SSE connection for real-time match updates
  useEffect(() => {
    if (!id) return;

    const connectSSE = () => {
      console.log(`[MATCH SSE] Connecting to match ${id} (attempt ${reconnectAttempts + 1})`);
      setConnectionStatus('connecting');

      // Close existing connection if any
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = new EventSource(`/api/match/${id}/stream`);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('[MATCH SSE] Connection opened');
        setConnectionStatus('connected');
        setError(null);
        setReconnectAttempts(0); // Reset reconnect attempts on successful connection
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[MATCH SSE] Received:', data.type);

          switch (data.type) {
            case 'match_state':
            case 'match_update':
              setMatchData(data.match);
              // If match is finished, persist the data
              if (data.match.status === 'FINISHED') {
                setFinishedMatchData(data.match);
              }
              break;
            case 'match_finished':
              setMatchData(data.match);
              setFinishedMatchData(data.match); // Persist finished match data
              console.log('[MATCH SSE] Match finished, data persisted');
              break;
            case 'match_deleted':
              // Only show error if we don't have finished match data
              if (!finishedMatchData) {
                setError('Match no longer exists');
              } else {
                console.log('[MATCH SSE] Match deleted but we have finished data cached');
              }
              break;
            case 'connected':
              console.log('[MATCH SSE] Connected to match updates');
              break;
            case 'error':
              setError(data.message || 'Connection error');
              break;
          }
        } catch (err) {
          console.error('[MATCH SSE] Error parsing message:', err);
        }
      };

      eventSource.onerror = (event) => {
        console.log('[MATCH SSE] Connection closed or error:', event);
        setConnectionStatus('disconnected');
        
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }

        // Handle reconnection logic
        setReconnectAttempts(currentAttempts => {
          // Check if we should attempt reconnection
          if (currentAttempts < maxReconnectAttempts) {
            console.log('[MATCH SSE] Attempting to fetch match data as fallback');
            fetchMatchData().then(fallbackMatch => {
              if (fallbackMatch) {
                setMatchData(fallbackMatch);
                if (fallbackMatch.status === 'FINISHED') {
                  setFinishedMatchData(fallbackMatch);
                  console.log('[MATCH SSE] Match finished, no reconnection needed');
                  return; // Don't reconnect if match is finished
                }
              }
              
              // Schedule reconnection if match is not finished
              reconnectTimeoutRef.current = setTimeout(() => {
                connectSSE();
              }, 2000 * (currentAttempts + 1)); // Exponential backoff
            });
            
            return currentAttempts + 1;
          } else {
            setError('Connection lost. Please refresh the page.');
            return currentAttempts;
          }
        });
      };
    };

    // Initial connection
    connectSSE();

    // Cleanup on unmount
    return () => {
      console.log('[MATCH SSE] Cleaning up connection');
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [id, fetchMatchData]); // Include memoized fetchMatchData

  // Use finished match data if available, otherwise use current match data
  const match: Match | null = finishedMatchData || matchData;
  const currentQuestion: Question | null = match?.questions[match?.currentQuestionIndex] || null;

  // Timer for current question
  useEffect(() => {
    if (match?.status === 'IN_PROGRESS' && currentQuestion && !hasAnswered) {
      setTimeLeft(24);
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setHasAnswered(true);
            // Auto-submit when time runs out - call directly to avoid dependency issues
            fetch('/api/match/answer', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                matchId: id,
                questionId: currentQuestion?.id,
                selectedOption: -1,
                timeRemaining: 0
              })
            }).catch(error => {
              console.error('Error submitting timeout answer:', error);
              setHasAnswered(false);
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [match?.currentQuestionIndex, hasAnswered, currentQuestion, match?.status, id]);

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
        const errorData = await response.json().catch(() => ({}));
        console.error('Start game failed:', response.status, errorData);
        throw new Error(errorData.error || `Failed to start game (${response.status})`);
      }
      
      const result = await response.json();
      console.log('Game started successfully:', result);
      
      // Match updates will come via SSE
    } catch (error) {
      console.error('Error starting game:', error);
      setError(error instanceof Error ? error.message : 'Failed to start game');
    }
  };

  const submitAnswer = async (answerIndex: number, timeRemaining: number) => {
    if (hasAnswered && answerIndex !== -1) return; // Allow auto-submit on timeout
    
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
      
      // Match updates will come via SSE
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

  if (error && !finishedMatchData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">Match Error</h1>
          <p className="text-xl mb-8">{error}</p>
          <div className="space-x-4">
            <button 
              onClick={() => window.location.reload()} 
              className="bg-white text-red-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100"
            >
              Refresh Page
            </button>
            <Link href="/" className="bg-white text-red-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100">
              Back to Home
            </Link>
          </div>
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
          <div className="mt-4 flex items-center justify-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-400' : 
              connectionStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'
            }`}></div>
            <span className="text-sm text-white/80 capitalize">{connectionStatus}</span>
            {reconnectAttempts > 0 && (
              <span className="text-sm text-white/60">
                (Reconnect attempt {reconnectAttempts}/{maxReconnectAttempts})
              </span>
            )}
          </div>
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
                    <Image
                      src={match.nftA.image}
                      alt={match.nftA.name}
                      className="w-full h-full object-cover"
                      width={100}
                      height={100}
                    />
                </div>
                <p>{match.nftA.name}</p>
              </div>

              {match.playerB && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
                  <h2 className="text-2xl font-bold mb-4">{match.playerB.name}</h2>
                                      <div className="w-32 h-40 mx-auto mb-4 rounded-lg overflow-hidden">
                      <Image
                        src={match.nftB!.image}
                        alt={match.nftB!.name}
                        className="w-full h-full object-cover"
                        width={100}
                        height={100}
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
                   match.winner === 'B' ? (match.playerB || null) : null;
    
    return (
      <GameFinishedScreen 
        match={match} 
        winner={winner} 
      />
    );
  }

  return null;
} 