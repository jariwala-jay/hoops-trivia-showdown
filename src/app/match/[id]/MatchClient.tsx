'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Match, Question, Player } from '@/types';
import Image from 'next/image';
import { useSound } from '@/hooks/useSound';
import ShotClock from '@/components/ShotClock';
import Navbar from '@/components/Navbar';
import AnimatedButton from '@/components/AnimatedButton';

interface MatchClientProps {
  id: string;
}

// Component for the finished game screen with NFT transfer functionality
function GameFinishedScreen({ match, winner }: { match: Match; winner: Player | null }) {
  const [isTransferring, setIsTransferring] = useState(false);
  const [myTransferStatus, setMyTransferStatus] = useState<string | null>(null);
  const [myTransferError, setMyTransferError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current user ID
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setCurrentUserId(userData.sub);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  // Set transfer status from match data based on current user
  useEffect(() => {
    if (match.winner !== 'TIE' && currentUserId) {
      const isPlayerA = match.playerA.id === currentUserId;
      const isPlayerB = match.playerB?.id === currentUserId;
      const userIsLoser = (isPlayerA && match.winner === 'B') || (isPlayerB && match.winner === 'A');
      
      if (userIsLoser) {
        const userPlayer = isPlayerA ? 'A' : 'B';
        const statusKey = `nftTransfer${userPlayer}Status` as keyof typeof match;
        const errorKey = `nftTransfer${userPlayer}Error` as keyof typeof match;
        
        setMyTransferStatus((match[statusKey] as string) || 'PENDING');
        setMyTransferError((match[errorKey] as string) || null);
      } else {
        // User is winner - no transfer needed from them
        setMyTransferStatus('NOT_REQUIRED');
        setMyTransferError(null);
      }
    }
  }, [match, currentUserId]);

  // Periodically check for transfer completion when IN_PROGRESS
  useEffect(() => {
    if (myTransferStatus === 'IN_PROGRESS') {
      const interval = setInterval(() => {
        checkTransferStatus();
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, [myTransferStatus]);

  const checkTransferStatus = async () => {
    try {
      const response = await fetch(`/api/match/transfer-my-nft?matchId=${match.id}`);
      if (response.ok) {
        const data = await response.json();
        // This will be updated via SSE, but we can show immediate feedback
        console.log('My transfer status check:', data);
      }
    } catch (error) {
      console.error('Error checking transfer status:', error);
    }
  };

  const handleRetryTransfer = async () => {
    setIsTransferring(true);
    setMyTransferError(null);

    try {
      const response = await fetch('/api/match/transfer-my-nft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matchId: match.id }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMyTransferStatus('COMPLETED');
        setMyTransferError(null);
      } else {
        setMyTransferError(data.error || 'Transfer failed');
        setMyTransferStatus('FAILED');
      }
    } catch (error) {
      setMyTransferError(error instanceof Error ? error.message : 'Unknown error');
      setMyTransferStatus('FAILED');
    } finally {
      setIsTransferring(false);
    }
  };

  const renderTransferStatus = () => {
    if (match.winner === 'TIE') {
      return (
        <div style={{ marginBottom: '2rem' }}>
          <div className="card" style={{
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            border: '1px solid rgba(59, 130, 246, 0.3)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.5rem' 
            }}>
              <div style={{ color: '#60A5FA' }}>🤝</div>
              <span style={{ color: '#BFDBFE' }}>No NFT transfers - each player keeps their NFT!</span>
            </div>
          </div>
        </div>
      );
    }

    switch (myTransferStatus) {
      case 'COMPLETED':
        return (
          <div style={{ marginBottom: '2rem' }}>
            <div className="card" style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2))',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '1.5rem'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.75rem',
                  marginBottom: '0.75rem'
                }}>
                  <div style={{ color: '#10B981', fontSize: '1.5rem' }}>🎊</div>
                  <span style={{ 
                    color: '#A7F3D0', 
                    fontSize: '1.125rem',
                    fontWeight: 600
                  }}>
                    NFT Transfer Complete!
                  </span>
                </div>
                <p style={{ 
                  color: '#6EE7B7', 
                  fontSize: '1rem',
                  marginBottom: '0.5rem'
                }}>
                  Your NFT has been successfully transferred on the Flow blockchain.
                </p>
                <div style={{
                  marginTop: '1rem',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem'
                }}>
                  <p style={{ 
                    color: '#A7F3D0', 
                    fontSize: '0.875rem'
                  }}>
                    🎉 <strong>Success!</strong> Check your Dapper wallet to see your new NFT collection!
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'IN_PROGRESS':
        return (
          <div style={{ marginBottom: '2rem' }}>
            <div className="card" style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2))',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              padding: '1.5rem'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.75rem',
                  marginBottom: '0.75rem'
                }}>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                  <span style={{ 
                    color: '#BFDBFE', 
                    fontSize: '1.125rem',
                    fontWeight: 600
                  }}>
                    🎉 NFT Transfer In Progress!
                  </span>
                </div>
                <p style={{ 
                  color: '#93C5FD', 
                  fontSize: '1rem',
                  marginBottom: '0.5rem'
                }}>
                  Your NFT is being transferred on the Flow blockchain. This typically takes a few minutes to complete.
                </p>
                <p style={{ 
                  color: '#93C5FD', 
                  fontSize: '0.875rem'
                }}>
                  ✅ You can safely leave this page - the transfer will continue in the background.
                </p>
                <div style={{
                  marginTop: '1rem',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem'
                }}>
                  <p style={{ 
                    color: '#BFDBFE', 
                    fontSize: '0.875rem'
                  }}>
                    💡 <strong>Pro tip:</strong> Check your Dapper wallet in a few minutes to see your new NFT!
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'FAILED':
        return (
          <div style={{ marginBottom: '2rem' }}>
            <div className="card" style={{
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{ color: '#F87171' }}>⚠️</div>
                  <span style={{ color: '#FECACA' }}>NFT transfer failed</span>
                </div>
                {myTransferError && (
                  <p style={{ 
                    color: '#FCA5A5', 
                    fontSize: '0.875rem',
                    marginBottom: '0.75rem'
                  }}>
                    {myTransferError}
                  </p>
                )}
                <button
                  onClick={handleRetryTransfer}
                  disabled={isTransferring}
                  className="btn"
                  style={{
                    backgroundColor: '#EF4444',
                    color: '#F8F9FA',
                    padding: '0.5rem 1rem',
                    opacity: isTransferring ? 0.5 : 1
                  }}
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
          <div style={{ marginBottom: '2rem' }}>
            <div className="card" style={{
              backgroundColor: 'rgba(249, 115, 22, 0.2)',
              border: '1px solid rgba(249, 115, 22, 0.3)'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{ color: '#FB923C' }}>⏳</div>
                  <span style={{ color: '#FED7AA' }}>Preparing NFT transfer...</span>
                </div>
                <p style={{ 
                  color: '#FDBA74', 
                  fontSize: '0.875rem',
                  marginBottom: '0.75rem'
                }}>
                  The system is setting up the NFT transfer. This should begin shortly.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={checkTransferStatus}
                    className="btn"
                    style={{
                      backgroundColor: '#F97316',
                      color: '#F8F9FA',
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    Refresh Status
                  </button>
                  <button
                    onClick={handleRetryTransfer}
                    disabled={isTransferring}
                    className="btn"
                    style={{
                      backgroundColor: '#3B82F6',
                      color: '#F8F9FA',
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem',
                      opacity: isTransferring ? 0.5 : 1
                    }}
                  >
                    {isTransferring ? 'Starting Transfer...' : 'Retry Transfer'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

      return (
      <div style={{ minHeight: '100vh' }}>
        <Navbar />
        <div style={{ 
          maxWidth: '96rem', 
          margin: '0 auto', 
          padding: '2rem 1rem',
          paddingTop: '6rem'
        }}>
        {/* Victory Banner */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            background: match.winner === 'TIE' 
              ? 'linear-gradient(135deg, #00C176, #0B2545)' 
              : winner 
              ? 'linear-gradient(135deg, #FF6E00, #E63946)' 
              : 'linear-gradient(135deg, #0B2545, #374151)',
            borderRadius: '1rem',
            padding: '3rem 2rem',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '4rem',
              marginBottom: '1rem'
            }}>
              {match.winner === 'TIE' ? '🤝' : '🏆'}
            </div>
            <h1 style={{
              fontSize: '4rem',
              fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
              fontWeight: 800,
              color: '#F8F9FA',
              marginBottom: '1rem',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
            }}>
              {match.winner === 'TIE' ? 'Epic Tie Game!' : 'Game Over!'}
            </h1>
            
            {winner && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{
                  fontSize: '2.5rem',
                  fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                  fontWeight: 700,
                  color: '#F8F9FA',
                  marginBottom: '0.5rem'
                }}>
                  🎉 {winner.name} Wins!
                </h2>
                <p style={{
                  fontSize: '1.25rem',
                  color: 'rgba(248, 249, 250, 0.8)'
                }}>
                  Congratulations! You win both NFTs!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* NFT Transfer Status */}
        {renderTransferStatus()}
        
        {/* Match Results */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          <div className="card" style={{
            border: match.winner === 'A' ? '2px solid #FF6E00' : '1px solid rgba(75, 85, 99, 0.3)',
            backgroundColor: match.winner === 'A' ? 'rgba(255, 110, 0, 0.1)' : undefined
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                fontWeight: 700,
                color: '#F8F9FA'
              }}>
                {match.playerA.name}
              </h3>
              {match.winner === 'A' && <div style={{ fontSize: '1.5rem' }}>👑</div>}
            </div>
            
            <div style={{
              fontSize: '3rem',
              fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
              fontWeight: 800,
              color: '#FF6E00',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              {match.scoreA}
            </div>
            
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '10rem',
                height: '12.5rem',
                margin: '0 auto',
                borderRadius: '0.5rem',
                overflow: 'hidden',
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
              }}>
                <img
                  src={match.nftA.image}
                  alt={match.nftA.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              {match.winner === 'B' && (myTransferStatus === 'IN_PROGRESS' || myTransferStatus === 'COMPLETED') && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{ color: '#F8F9FA', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>➡️</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>
                      {myTransferStatus === 'IN_PROGRESS' ? 'Transferring...' : 'Transferred'}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <p style={{ 
              marginTop: '0.75rem', 
              fontWeight: 600,
              color: '#F8F9FA',
              textAlign: 'center'
            }}>
              {match.nftA.name}
            </p>
            <p style={{ 
              fontSize: '0.875rem', 
              color: '#9CA3AF',
              textAlign: 'center'
            }}>
              {match.nftA.rarity}
            </p>
          </div>

          <div className="card" style={{
            border: match.winner === 'B' ? '2px solid #00C176' : '1px solid rgba(75, 85, 99, 0.3)',
            backgroundColor: match.winner === 'B' ? 'rgba(0, 193, 118, 0.1)' : undefined
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                fontWeight: 700,
                color: '#F8F9FA'
              }}>
                {match.playerB?.name}
              </h3>
              {match.winner === 'B' && <div style={{ fontSize: '1.5rem' }}>👑</div>}
            </div>
            
            <div style={{
              fontSize: '3rem',
              fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
              fontWeight: 800,
              color: '#00C176',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              {match.scoreB}
            </div>
            
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '10rem',
                height: '12.5rem',
                margin: '0 auto',
                borderRadius: '0.5rem',
                overflow: 'hidden',
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
              }}>
                <img
                  src={match.nftB!.image}
                  alt={match.nftB!.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              {match.winner === 'A' && (myTransferStatus === 'IN_PROGRESS' || myTransferStatus === 'COMPLETED') && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{ color: '#F8F9FA', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>➡️</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>
                      {myTransferStatus === 'IN_PROGRESS' ? 'Transferring...' : 'Transferred'}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <p style={{ 
              marginTop: '0.75rem', 
              fontWeight: 600,
              color: '#F8F9FA',
              textAlign: 'center'
            }}>
              {match.nftB!.name}
            </p>
            <p style={{ 
              fontSize: '0.875rem', 
              color: '#9CA3AF',
              textAlign: 'center'
            }}>
              {match.nftB!.rarity}
            </p>
          </div>
        </div>

        {/* Game Stats */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{
            fontSize: '1.5rem',
            fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
            fontWeight: 700,
            color: '#F8F9FA',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            📊 Match Statistics
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1.5rem',
            textAlign: 'center'
          }}>
            <div>
              <div style={{
                fontSize: '2rem',
                fontWeight: 700,
                color: '#FF6E00',
                marginBottom: '0.25rem'
              }}>
                {match.questions.length}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: '#9CA3AF',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Questions
              </div>
            </div>
            <div>
              <div style={{
                fontSize: '2rem',
                fontWeight: 700,
                color: '#00C176',
                marginBottom: '0.25rem'
              }}>
                {Math.abs(match.scoreA - match.scoreB)}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: '#9CA3AF',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Point Difference
              </div>
            </div>
            <div>
              <div style={{
                fontSize: '2rem',
                fontWeight: 700,
                color: '#E63946',
                marginBottom: '0.25rem'
              }}>
                {match.scoreA + match.scoreB}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: '#9CA3AF',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Total Points
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <Link
            href="/create"
            className="btn btn-primary"
            style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              padding: '1rem 2rem',
              textAlign: 'center',
              textDecoration: 'none'
            }}
          >
            🚀 Create New Match
          </Link>
          <Link
            href="/automatch"
            className="btn"
            style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              padding: '1rem 2rem',
              backgroundColor: '#8B5CF6',
              color: '#F8F9FA',
              textAlign: 'center',
              textDecoration: 'none'
            }}
          >
            ⚡ Quick Match
          </Link>
          <button
            onClick={() => {
              const tweetText = match.winner === 'TIE' 
                ? `Just played an epic NBA trivia showdown that ended in a tie! 🤝 Final score: ${match.scoreA}-${match.scoreB} #HoopsTrivia #NBATopShot`
                : `Just ${winner ? 'won' : 'played'} an epic NBA trivia showdown! 🏀 Final score: ${match.scoreA}-${match.scoreB} ${winner ? `Winner: ${winner.name} 🏆` : ''} #HoopsTrivia #NBATopShot`;
              const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
              window.open(tweetUrl, '_blank');
            }}
            className="btn"
            style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              padding: '1rem 2rem',
              backgroundColor: '#3B82F6',
              color: '#F8F9FA'
            }}
          >
            🐦 Share Result
          </button>
          <Link
            href="/"
            className="btn btn-secondary"
            style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              padding: '1rem 2rem',
              textAlign: 'center',
              textDecoration: 'none'
            }}
          >
            🏠 Home Court
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
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [matchData, setMatchData] = useState<Match | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [finishedMatchData, setFinishedMatchData] = useState<Match | null>(null); // Persist finished match data
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 3;
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Sound effects
  const buzzerSound = useSound('/sfx/buzzer.mp3');
  const swishSound = useSound('/sfx/swish.mp3');
  const cheerSound = useSound('/sfx/cheer.mp3');
  const beepSound = useSound('/sfx/beep.mp3');

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        console.log('[USER] Fetching current user...');
        const response = await fetch('/api/auth/me');
        console.log('[USER] Response status:', response.status);
        if (response.ok) {
          const userData = await response.json();
          console.log('[USER] User data received:', userData);
          console.log('[USER] User sub:', userData.sub);
          setCurrentUserId(userData.sub);
          console.log('[USER] Current user ID set to:', userData.sub);
        } else {
          console.error('[USER] Response not OK:', response.status);
        }
      } catch (error) {
        console.error('[USER] Failed to get current user:', error);
      }
    };
    getCurrentUser();
  }, []);

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

    // First, try to fetch match data to ensure it exists
    const initializeMatch = async () => {
      console.log(`[MATCH] Initializing match ${id}`);
      const initialMatch = await fetchMatchData();
      if (initialMatch) {
        setMatchData(initialMatch);
        console.log(`[MATCH] Initial match data loaded, status: ${initialMatch.status}`);
        // Now start SSE connection
        connectSSE();
      } else {
        setError('Match not found');
        console.error(`[MATCH] Match ${id} not found`);
      }
    };

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
              // Play victory sound
              cheerSound.play();
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

    // Initialize match and start SSE
    initializeMatch();

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
            // Play buzzer sound when time runs out
            buzzerSound.play();
            // Auto-submit when time runs out - call directly to avoid dependency issues
            fetch('/api/match/answer', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                matchId: id,
                questionId: currentQuestion?.id,
                selectedOption: -1,
                timeRemaining: 0,
                playerId: currentUserId
              })
            }).catch(error => {
              console.error('Error submitting timeout answer:', error);
              setHasAnswered(false);
            });
            return 0;
          }
          // Play beep sound in last 5 seconds
          if (prev <= 5) {
            beepSound.play();
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [match?.currentQuestionIndex, hasAnswered, match?.status, id]); // Removed currentQuestion to prevent timer reset on match updates

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
          playerId: currentUserId // Include player ID for proper identification
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
    setHasAnswered(true);
    
    // Show feedback and play sound for valid answer selection
    if (currentQuestion && answerIndex >= 0) {
      setShowFeedback(true);
      
      // Play swish sound for answer selection
      swishSound.play();
      
      // Hide feedback after 2 seconds
      setTimeout(() => {
        setShowFeedback(false);
      }, 2000);
    }
    
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
      <div style={{ minHeight: '100vh' }}>
        <Navbar />
        <div style={{ 
          maxWidth: '56rem', 
          margin: '0 auto', 
          padding: '2rem 1rem',
          paddingTop: '6rem',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
            fontWeight: 700,
            color: '#F8F9FA',
            marginBottom: '2rem'
          }}>
            ⏳ Waiting for Opponent...
          </h1>
          
          <div className="card" style={{ marginBottom: '2rem' }}>
            <p style={{
              color: '#F8F9FA',
              fontSize: '1.25rem',
              marginBottom: '1.5rem'
            }}>
              Share this Match ID with your opponent:
            </p>
            <div style={{
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '0.5rem',
              padding: '1rem',
              fontFamily: 'monospace',
              color: '#F8F9FA',
              fontSize: '1.125rem',
              wordBreak: 'break-all',
              marginBottom: '1rem'
            }}>
              {match.id}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(match.id);
                alert('Match ID copied to clipboard!');
              }}
              className="btn btn-primary"
            >
              📋 Copy Match ID
            </button>
          </div>

          <div className="animate-pulse">
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⏳</div>
            <p style={{
              color: '#F8F9FA',
              fontSize: '1.25rem',
              marginBottom: '1rem'
            }}>
              Waiting for player to join the arena...
            </p>
            <div style={{ 
              marginTop: '1rem', 
              display: 'flex', 
              justifyContent: 'center',
              gap: '0.25rem'
            }}>
              <div className="animate-bounce" style={{ color: '#FF6E00' }}>●</div>
              <div className="animate-bounce" style={{ color: '#FF6E00', animationDelay: '0.1s' }}>●</div>
              <div className="animate-bounce" style={{ color: '#FF6E00', animationDelay: '0.2s' }}>●</div>
            </div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <Link 
              href="/" 
              style={{
                color: '#F8F9FA',
                textDecoration: 'none',
                opacity: 0.8,
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Match ready - show start button
  if (match.status === 'READY') {
    return (
      <div style={{ minHeight: '100vh' }}>
        <Navbar />
        <div style={{ 
          maxWidth: '64rem', 
          margin: '0 auto', 
          padding: '2rem 1rem',
          paddingTop: '6rem',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
            fontWeight: 700,
            color: '#F8F9FA',
            marginBottom: '2rem'
          }}>
            🏀 Match Ready!
          </h1>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            marginBottom: '2rem'
          }}>
            <div className="card">
              <h2 style={{
                fontSize: '1.5rem',
                fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                fontWeight: 700,
                color: '#F8F9FA',
                marginBottom: '1rem'
              }}>
                {match.playerA.name}
              </h2>
              <div style={{
                width: '8rem',
                height: '10rem',
                margin: '0 auto 1rem auto',
                borderRadius: '0.5rem',
                overflow: 'hidden'
              }}>
                <Image
                  src={match.nftA.image}
                  alt={match.nftA.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  width={100}
                  height={100}
                />
              </div>
              <p style={{ color: '#D1D5DB' }}>{match.nftA.name}</p>
            </div>

            {match.playerB && (
              <div className="card">
                <h2 style={{
                  fontSize: '1.5rem',
                  fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                  fontWeight: 700,
                  color: '#F8F9FA',
                  marginBottom: '1rem'
                }}>
                  {match.playerB.name}
                </h2>
                <div style={{
                  width: '8rem',
                  height: '10rem',
                  margin: '0 auto 1rem auto',
                  borderRadius: '0.5rem',
                  overflow: 'hidden'
                }}>
                  <Image
                    src={match.nftB!.image}
                    alt={match.nftB!.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    width={100}
                    height={100}
                  />
                </div>
                <p style={{ color: '#D1D5DB' }}>{match.nftB!.name}</p>
              </div>
            )}
          </div>

          <button
            onClick={startGame}
            className="btn btn-primary"
            style={{ fontSize: '1.25rem', padding: '1rem 2rem' }}
          >
            Start Game! 🏀
          </button>
        </div>
      </div>
    );
  }

  // Game in progress
  if (match.status === 'IN_PROGRESS' && currentQuestion) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <Navbar />
        <div style={{ 
          maxWidth: '80rem', 
          margin: '0 auto', 
          padding: '1rem',
          paddingTop: '5rem' // Reduced padding to prevent overlap
        }}>
          {/* Game Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            marginBottom: '1.5rem',
            gap: '1rem'
          }}>
            {/* Player A Score */}
            <div style={{ textAlign: 'center', minWidth: '120px' }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                fontWeight: 700,
                color: '#F8F9FA',
                marginBottom: '0.5rem'
              }}>
                {match.playerA.name}
              </h3>
              <div style={{
                fontSize: '2rem',
                fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                fontWeight: 700,
                color: '#FF6E00'
              }}>
                {match.scoreA}
              </div>
            </div>
            
            {/* Shot Clock Timer */}
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{
                fontSize: '0.875rem',
                color: '#D1D5DB',
                marginBottom: '0.5rem'
              }}>
                Question {(match.currentQuestionIndex || 0) + 1} of {match.questions.length}
              </div>
              <ShotClock 
                duration={24}
                timeLeft={timeLeft}
                onTimeUp={() => {
                  buzzerSound.play();
                  handleAnswerSelect(-1); // Auto-submit when time runs out
                }}
                isActive={!hasAnswered}
                size="lg"
              />
              <div style={{
                fontSize: '0.875rem',
                color: '#D1D5DB',
                marginTop: '0.5rem'
              }}>
                seconds
              </div>
            </div>
            
            {/* Player B Score */}
            <div style={{ textAlign: 'right', minWidth: '120px' }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                fontWeight: 700,
                color: '#F8F9FA',
                marginBottom: '0.5rem'
              }}>
                {match.playerB?.name}
              </h3>
              <div style={{
                fontSize: '2rem',
                fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                fontWeight: 700,
                color: '#00C176'
              }}>
                {match.scoreB}
              </div>
            </div>
          </div>

          {/* Waiting for opponent indicator */}
          {waitingForOpponent && (
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div className="card" style={{
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                border: '1px solid rgba(245, 158, 11, 0.3)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.5rem' 
                }}>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                  <span style={{ color: '#FDE68A' }}>Waiting for opponent&apos;s answer...</span>
                </div>
              </div>
            </div>
          )}

          {/* Question */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
              fontWeight: 700,
              color: '#F8F9FA',
              marginBottom: '1.5rem',
              textAlign: 'center',
              lineHeight: '1.4'
            }}>
              {currentQuestion.question}
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1rem'
            }}>
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrect = index === currentQuestion.correctAnswer;
                const feedbackState = showFeedback 
                  ? (isSelected && isCorrect ? 'correct' : isSelected && !isCorrect ? 'incorrect' : 'neutral')
                  : 'neutral';
                
                return (
                  <AnimatedButton
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={hasAnswered}
                    variant={isSelected ? 'primary' : 'secondary'}
                    feedbackState={feedbackState}
                    className={`text-left ${hasAnswered && !isSelected ? 'opacity-50' : ''}`}
                  >
                    <span style={{ 
                      fontWeight: 700, 
                      marginRight: '0.5rem',
                      color: isSelected ? '#F8F9FA' : '#FF6E00'
                    }}>
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <span style={{
                      color: isSelected ? '#F8F9FA' : '#F8F9FA'
                    }}>
                      {option}
                    </span>
                  </AnimatedButton>
                );
              })}
            </div>
            
            {hasAnswered && (
              <div style={{ 
                textAlign: 'center', 
                marginTop: '1.5rem',
                padding: '1rem',
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                borderRadius: '0.5rem',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                <div style={{ 
                  color: '#10B981', 
                  fontWeight: 700,
                  fontSize: '1.125rem'
                }}>
                  ✓ Answer submitted!
                </div>
              </div>
            )}
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