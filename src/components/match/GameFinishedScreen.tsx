'use client';

import { Match, Player } from '@/types';
import { truncateName } from '@/lib/utils';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function GameFinishedScreen({ match, winner }: { match: Match; winner: Player | null }) {
  const [isTransferring, setIsTransferring] = useState(false);
  const [myTransferStatus, setMyTransferStatus] = useState<string | null>(null);
  const [myTransferError, setMyTransferError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoser, setIsLoser] = useState(false);

  // Get current user ID
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/auth/profile');
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

  // Determine user's role (loser/winner) and set transfer status from match data
  useEffect(() => {
    if (match.winner !== 'TIE' && currentUserId) {
      const isPlayerA = match.playerA.id === currentUserId;
      const userIsLoser = (isPlayerA && match.winner === 'B') || (!isPlayerA && match.winner === 'A');
      setIsLoser(userIsLoser);
      
      const playerLetter = isPlayerA ? 'A' : 'B';
      const statusKey = `nftTransfer${playerLetter}Status` as keyof typeof match;
      const errorKey = `nftTransfer${playerLetter}Error` as keyof typeof match;
      
      setMyTransferStatus((match[statusKey] as string) || 'PENDING');
      setMyTransferError((match[errorKey] as string) || null);
    }
  }, [match, currentUserId]);

  // Automatically trigger the transfer for the loser
  useEffect(() => {
    if (isLoser && myTransferStatus === 'PENDING' && !isTransferring) {
      console.log('[AUTO-TRANSFER] User is the loser, automatically initiating transfer...');
      handleTransferClick();
    }
  }, [isLoser, myTransferStatus, isTransferring]);

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

  const handleTransferClick = async () => {
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
        setMyTransferStatus('IN_PROGRESS'); // Set to in-progress, SSE will update to COMPLETED
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
        <div className="card text-center p-4 bg-blue-500/20 border-blue-500/30">
          <p className="text-blue-300">🤝 No NFT transfers - each player keeps their NFT!</p>
        </div>
      );
    }

    if (isLoser) {
      // Logic for the LOSER
      switch (myTransferStatus) {
        case 'COMPLETED':
          return <div className="card text-center p-4 bg-green-500/20 border-green-500/30"><p className="text-green-300">✅ Your NFT has been transferred successfully.</p></div>;
        case 'IN_PROGRESS':
          return <div className="card text-center p-4 bg-purple-500/20 border-purple-500/30"><p className="text-purple-300">⏳ Your NFT transfer is in progress...</p></div>;
        case 'FAILED':
          return (
            <div className="card text-center p-4 bg-red-500/20 border-red-500/30">
              <p className="text-red-300 mb-2">⚠️ Transfer failed: {myTransferError}</p>
              <button onClick={handleTransferClick} disabled={isTransferring} className="btn btn-danger">
                {isTransferring ? 'Retrying...' : 'Retry Transfer'}
              </button>
            </div>
          );
        case 'PENDING':
        default:
          return (
            <div className="card text-center p-4 bg-orange-500/20 border-orange-500/30">
              <p className="text-orange-300 mb-2">You lost the match. You need to transfer your NFT to the winner.</p>
              <button onClick={handleTransferClick} disabled={isTransferring} className="btn btn-primary">
                {isTransferring ? 'Initiating...' : 'Transfer My NFT'}
              </button>
            </div>
          );
      }
    } else {
      // Logic for the WINNER
      const opponentPlayer = match.playerA.id === currentUserId ? 'B' : 'A';
      const opponentStatusKey = `nftTransfer${opponentPlayer}Status` as keyof typeof match;
      const opponentStatus = match[opponentStatusKey] as string;

      switch (opponentStatus) {
        case 'COMPLETED':
          return <div className="card text-center p-4 bg-green-500/20 border-green-500/30"><p className="text-green-300">🎉 You won! The opponent&apos;s NFT has been transferred to you.</p></div>;
        case 'IN_PROGRESS':
          return <div className="card text-center p-4 bg-purple-500/20 border-purple-500/30"><p className="text-purple-300">⏳ Waiting for opponent to transfer their NFT...</p></div>;
        case 'FAILED':
          return <div className="card text-center p-4 bg-red-500/20 border-red-500/30"><p className="text-red-300">⚠️ Opponent&apos;s transfer failed. Please have them retry.</p></div>;
        case 'PENDING':
        default:
          return (
            <div className="card text-center p-4 bg-gray-600/20 border-gray-500/30">
              <p className="text-gray-300">🏆 You won! Waiting for the opponent to initiate their NFT transfer.</p>
            </div>
          );
      }
    }
  };

  return (
    <div className="p-4" style={{ paddingTop: '1rem', paddingBottom: '2rem' }}>
      <div style={{ maxWidth: '60rem', margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '2rem'
        }}>
          {renderTransferStatus()}
        </div>

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
                {truncateName(match.playerA.name)}
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
                <Image
                  src={match.nftA.image}
                  alt={match.nftA.name}
                  style={{ objectFit: 'cover' }}
                  width={100}
                  height={100}
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
                {truncateName(match.playerB?.name)}
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
                <Image
                  src={match.nftB!.image}
                  alt={match.nftB!.name}
                  style={{ objectFit: 'cover' }}
                  width={100}
                  height={100}
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
                : `Just ${winner ? 'won' : 'played'} an epic NBA trivia showdown! 🏀 Final score: ${match.scoreA}-${match.scoreB} ${winner ? `Winner: ${truncateName(winner.name)} 🏆` : ''} #HoopsTrivia #NBATopShot`;
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