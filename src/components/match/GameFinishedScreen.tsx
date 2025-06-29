'use client';

import { Match, Player } from '@/types';
import { truncateName } from '@/lib/utils';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import AnimatedButton from '@/components/AnimatedButton';

export function GameFinishedScreen({ 
  match, 
  winner,
  currentUserId,
}: { 
  match: Match; 
  winner: Player | null,
  currentUserId: string | null,
}) {
  const [isTransferring, setIsTransferring] = useState(false);
  const [myTransferStatus, setMyTransferStatus] = useState<string | null>(null);
  const [myTransferError, setMyTransferError] = useState<string | null>(null);
  const [isLoser, setIsLoser] = useState(false);

  // Get current user ID is now passed via props
  
  const checkTransferStatus = useCallback(async () => {
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
  }, [match.id]);

  const handleTransferClick = useCallback(async () => {
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
  }, [match.id]);

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
  }, [isLoser, myTransferStatus, isTransferring, handleTransferClick]);

  // Periodically check for transfer completion when IN_PROGRESS
  useEffect(() => {
    if (myTransferStatus === 'IN_PROGRESS') {
      const interval = setInterval(() => {
        checkTransferStatus();
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, [myTransferStatus, checkTransferStatus]);

  const isPlayerB = currentUserId === match.playerB?.id;

  const playerA = isPlayerB ? match.playerB : match.playerA;
  const playerB = isPlayerB ? match.playerA : match.playerB;
  const scoreA = isPlayerB ? match.scoreB : match.scoreA;
  const scoreB = isPlayerB ? match.scoreA : match.scoreB;
  const nftA = isPlayerB ? match.nftB : match.nftA;
  const nftB = isPlayerB ? match.nftA : match.nftB;

  const renderTransferStatus = () => {
    if (match.winner === 'TIE') {
      return (
        <div style={{
          padding: '1.5rem',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '0.75rem',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
            fontSize: '1.25rem'
          }}>
            =
          </div>
          <h3 style={{
            fontSize: '1.25rem',
            fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
            fontWeight: 600,
            color: '#3B82F6',
            marginBottom: '0.5rem'
          }}>
            Match Tied
          </h3>
          <p style={{ color: '#93C5FD', fontSize: '0.875rem' }}>
            No NFT transfers - each player keeps their NFT
          </p>
        </div>
      );
    }

    if (isLoser) {
      // Logic for the LOSER
      switch (myTransferStatus) {
        case 'COMPLETED':
          return (
            <div style={{
              padding: '1.5rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              textAlign: 'center'
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
                fontSize: '1.25rem'
              }}>
                ✗
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                fontWeight: 600,
                color: '#EF4444',
                marginBottom: '0.5rem'
              }}>
                You Lost
              </h3>
              <p style={{ color: '#FCA5A5', fontSize: '0.875rem' }}>
                Your NFT has been transferred to the winner
              </p>
            </div>
          );
        case 'IN_PROGRESS':
          return (
            <div style={{
              padding: '1.5rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              textAlign: 'center'
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto'
              }}>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-400"></div>
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                fontWeight: 600,
                color: '#EF4444',
                marginBottom: '0.5rem'
              }}>
                You Lost
              </h3>
              <p style={{ color: '#FCA5A5', fontSize: '0.875rem' }}>
                Transferring your NFT to the winner...
              </p>
            </div>
          );
        case 'FAILED':
          return (
            <div style={{
              padding: '1.5rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              textAlign: 'center'
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
                fontSize: '1.25rem'
              }}>
                !
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                fontWeight: 600,
                color: '#EF4444',
                marginBottom: '0.5rem'
              }}>
                You Lost - Transfer Failed
              </h3>
              <p style={{ color: '#FCA5A5', fontSize: '0.875rem', marginBottom: '1rem' }}>
                {myTransferError || 'Transfer failed. You need to retry to complete the match.'}
              </p>
              <AnimatedButton
                onClick={handleTransferClick}
                disabled={isTransferring}
                variant="secondary"
                size="sm"
              >
                {isTransferring ? 'Retrying...' : 'Retry Transfer'}
              </AnimatedButton>
            </div>
          );
        case 'PENDING':
        default:
          return (
            <div style={{
              padding: '1.5rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              textAlign: 'center'
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
                fontSize: '1.25rem'
              }}>
                ✗
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                fontWeight: 600,
                color: '#EF4444',
                marginBottom: '0.5rem'
              }}>
                You Lost
              </h3>
              <p style={{ color: '#FCA5A5', fontSize: '0.875rem', marginBottom: '1rem' }}>
                You need to transfer your NFT to the winner
              </p>
              <AnimatedButton
                onClick={handleTransferClick}
                disabled={isTransferring}
                variant="secondary"
                size="md"
              >
                {isTransferring ? 'Initiating...' : 'Transfer NFT'}
              </AnimatedButton>
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
          return (
            <div style={{
              padding: '1.5rem',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              textAlign: 'center'
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
                fontSize: '1.25rem'
              }}>
                ★
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                fontWeight: 600,
                color: '#22C55E',
                marginBottom: '0.5rem'
              }}>
                Victory Complete
              </h3>
              <p style={{ color: '#86EFAC', fontSize: '0.875rem' }}>
                The opponent&apos;s NFT has been transferred to you
              </p>
            </div>
          );
        case 'IN_PROGRESS':
          return (
            <div style={{
              padding: '1.5rem',
              backgroundColor: 'rgba(168, 85, 247, 0.1)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(168, 85, 247, 0.2)',
              textAlign: 'center'
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                backgroundColor: 'rgba(168, 85, 247, 0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto'
              }}>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                fontWeight: 600,
                color: '#A855F7',
                marginBottom: '0.5rem'
              }}>
                Awaiting Transfer
              </h3>
              <p style={{ color: '#C4B5FD', fontSize: '0.875rem' }}>
                Waiting for opponent to transfer their NFT...
              </p>
            </div>
          );
        case 'FAILED':
          return (
            <div style={{
              padding: '1.5rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              textAlign: 'center'
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
                fontSize: '1.25rem'
              }}>
                !
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                fontWeight: 600,
                color: '#EF4444',
                marginBottom: '0.5rem'
              }}>
                Transfer Issue
              </h3>
              <p style={{ color: '#FCA5A5', fontSize: '0.875rem' }}>
                Opponent&apos;s transfer failed. Please have them retry.
              </p>
            </div>
          );
        case 'PENDING':
        default:
          return (
            <div style={{
              padding: '1.5rem',
              backgroundColor: 'rgba(156, 163, 175, 0.1)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(156, 163, 175, 0.2)',
              textAlign: 'center'
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                backgroundColor: 'rgba(156, 163, 175, 0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
                fontSize: '1.25rem'
              }}>
                ★
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                fontWeight: 600,
                color: '#9CA3AF',
                marginBottom: '0.5rem'
              }}>
                You Won!
              </h3>
              <p style={{ color: '#D1D5DB', fontSize: '0.875rem' }}>
                Waiting for the opponent to initiate their NFT transfer
              </p>
            </div>
          );
      }
    }
  };

  return (
    <div style={{ 
      padding: '2rem 1rem',
      maxWidth: '72rem',
      margin: '0 auto'
    }}>
      {/* Game Result Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '3rem'
      }}>
        {renderTransferStatus()}
      </div>

      {/* Player Results */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '2rem',
        marginBottom: '3rem'
      }}>
        {/* Player A */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '1rem',
          padding: '2rem',
          border: ((match.winner === 'A' && !isPlayerB) || (match.winner === 'B' && isPlayerB)) ? '2px solid #FF6E00' : '1px solid rgba(255, 255, 255, 0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {((match.winner === 'A' && !isPlayerB) || (match.winner === 'B' && isPlayerB)) && (
            <div style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              width: '2.5rem',
              height: '2.5rem',
              backgroundColor: '#FF6E00',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              color: 'white'
            }}>
              ★
            </div>
          )}
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              width: '4rem',
              height: '5rem',
              borderRadius: '0.5rem',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              {nftA && (
                <Image
                  src={nftA.image}
                  alt={nftA.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  width={64}
                  height={80}
                />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                fontWeight: 700,
                color: '#F8F9FA',
                marginBottom: '0.25rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {truncateName(playerA?.name)}
              </h3>
              <p style={{
                color: '#9CA3AF',
                fontSize: '0.875rem',
                marginBottom: '0.5rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {nftA?.name}
              </p>
              <span style={{
                display: 'inline-block',
                padding: '0.125rem 0.5rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 500,
                backgroundColor: 'rgba(156, 163, 175, 0.2)',
                color: '#9CA3AF'
              }}>
                {nftA?.rarity || 'Common'}
              </span>
            </div>
          </div>
          
          <div style={{
            textAlign: 'center',
            padding: '1.5rem',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '0.75rem'
          }}>
            <div style={{
              fontSize: '3rem',
              fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
              fontWeight: 800,
              color: '#FF6E00',
              lineHeight: 1
            }}>
              {scoreA}
            </div>
            <div style={{
              fontSize: '0.875rem',
              color: '#9CA3AF',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginTop: '0.25rem'
            }}>
              Points
            </div>
          </div>
        </div>

        {/* Player B */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '1rem',
          padding: '2rem',
          border: ((match.winner === 'A' && isPlayerB) || (match.winner === 'B' && !isPlayerB)) ? '2px solid #00C176' : '1px solid rgba(255, 255, 255, 0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {((match.winner === 'A' && isPlayerB) || (match.winner === 'B' && !isPlayerB)) && (
            <div style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              width: '2.5rem',
              height: '2.5rem',
              backgroundColor: '#00C176',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              color: 'white'
            }}>
              ★
            </div>
          )}
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              width: '4rem',
              height: '5rem',
              borderRadius: '0.5rem',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              {nftB && (
                <Image
                  src={nftB.image}
                  alt={nftB.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  width={64}
                  height={80}
                />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                fontWeight: 700,
                color: '#F8F9FA',
                marginBottom: '0.25rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {truncateName(playerB?.name)}
              </h3>
              <p style={{
                color: '#9CA3AF',
                fontSize: '0.875rem',
                marginBottom: '0.5rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {nftB?.name}
              </p>
              <span style={{
                display: 'inline-block',
                padding: '0.125rem 0.5rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 500,
                backgroundColor: 'rgba(156, 163, 175, 0.2)',
                color: '#9CA3AF'
              }}>
                {nftB?.rarity || 'Common'}
              </span>
            </div>
          </div>
          
          <div style={{
            textAlign: 'center',
            padding: '1.5rem',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '0.75rem'
          }}>
            <div style={{
              fontSize: '3rem',
              fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
              fontWeight: 800,
              color: '#00C176',
              lineHeight: 1
            }}>
              {scoreB}
            </div>
            <div style={{
              fontSize: '0.875rem',
              color: '#9CA3AF',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginTop: '0.25rem'
            }}>
              Points
            </div>
          </div>
        </div>
      </div>

      {/* Match Statistics */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '1rem',
        padding: '2rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        marginBottom: '3rem'
      }}>
        <h3 style={{
          fontSize: '1.5rem',
          fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
          fontWeight: 700,
          color: '#F8F9FA',
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          Match Statistics
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '2rem',
          textAlign: 'center'
        }}>
          <div>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              color: '#FF6E00',
              marginBottom: '0.5rem',
              lineHeight: 1
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
              fontSize: '2.5rem',
              fontWeight: 700,
              color: '#00C176',
              marginBottom: '0.5rem',
              lineHeight: 1
            }}>
              {Math.abs(scoreA - scoreB)}
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
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        <Link
          href="/create"
          style={{ textDecoration: 'none' }}
        >
          <AnimatedButton
            variant="primary"
            size="lg"
            className="w-full"
          >
            Create New Match
          </AnimatedButton>
        </Link>
        
        <Link
          href="/automatch"
          style={{ textDecoration: 'none' }}
        >
          <AnimatedButton
            variant="secondary"
            size="lg"
            className="w-full"
          >
            Quick Match
          </AnimatedButton>
        </Link>
        
        <AnimatedButton
          onClick={() => {
            const tweetText = match.winner === 'TIE' 
              ? `Just played an epic NBA trivia showdown that ended in a tie! Final score: ${scoreA}-${scoreB} #HoopsTrivia #NBATopShot`
              : `Just ${winner ? 'won' : 'played'} an epic NBA trivia showdown! Final score: ${scoreA}-${scoreB} ${winner ? `Winner: ${truncateName(winner.name)}` : ''} #HoopsTrivia #NBATopShot`;
            const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
            window.open(tweetUrl, '_blank');
          }}
          variant="secondary"
          size="lg"
          className="w-full"
        >
          Share Result
        </AnimatedButton>
        
        <Link
          href="/"
          style={{ textDecoration: 'none' }}
        >
          <AnimatedButton
            variant="secondary"
            size="lg"
            className="w-full"
          >
            Home
          </AnimatedButton>
        </Link>
      </div>
    </div>
  );
} 