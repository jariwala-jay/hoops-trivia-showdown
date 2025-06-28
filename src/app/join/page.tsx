'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NFTSelector from '@/components/NFTSelector';
import Navbar from '@/components/Navbar';
import Container from '@/components/Container';
import Card from '@/components/Card';
import AnimatedButton from '@/components/AnimatedButton';
import LoadingSpinner from '@/components/LoadingSpinner';
import { NFT, Match } from '@/types';
import Image from 'next/image';
import { useUserMoments } from '@/hooks/useUserMoments';
import { truncateName } from '@/lib/utils';

export default function JoinMatchPage() {
  const [matchId, setMatchId] = useState('');
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isLoadingMatch, setIsLoadingMatch] = useState(false);
  const [matchInfo, setMatchInfo] = useState<Match | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rarityError, setRarityError] = useState<string | null>(null);
  const router = useRouter();
  const { flowAddress, isLoading: momentsLoading } = useUserMoments();

  console.log('Join page - Flow address:', flowAddress);
  console.log('Join page - Moments loading:', momentsLoading);

  // Fetch match info when matchId changes
  useEffect(() => {
    const fetchMatchInfo = async () => {
      if (!matchId.trim() || matchId === 'undefined') {
        setMatchInfo(null);
        setError(null);
        return;
      }

      setIsLoadingMatch(true);
      setError(null);

      try {
        const response = await fetch(`/api/match/${matchId}`);
        if (response.ok) {
          const data = await response.json();
          setMatchInfo(data.match);
        } else {
          setMatchInfo(null);
          setError('Match not found');
        }
              } catch {
          setMatchInfo(null);
          setError('Failed to load match');
        } finally {
        setIsLoadingMatch(false);
      }
    };

    const timeoutId = setTimeout(fetchMatchInfo, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [matchId]);

  // Check rarity compatibility when NFT is selected
  useEffect(() => {
    if (selectedNFT && matchInfo) {
      const matchNFTRarity = matchInfo.nftA.rarity?.toLowerCase();
      const selectedNFTRarity = selectedNFT.rarity?.toLowerCase();
      
      if (matchNFTRarity !== selectedNFTRarity) {
        setRarityError(`This match requires ${matchInfo.nftA.rarity} rarity NFTs. Your selected NFT is ${selectedNFT.rarity}.`);
      } else {
        setRarityError(null);
      }
    } else {
      setRarityError(null);
    }
  }, [selectedNFT, matchInfo]);

  const handleJoinMatch = async () => {
    if (!matchId.trim() || !selectedNFT) return;

    console.log('Attempting to join match with Flow address:', flowAddress);

    if (!flowAddress) {
      setError('Flow address not available. Please try again.');
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      const requestBody = {
        matchId: matchId.trim(),
        nft: selectedNFT,
        flowAddress: flowAddress,
      };
      
      console.log('=== JOIN MATCH REQUEST DEBUG ===');
      console.log('Request body being sent:', JSON.stringify(requestBody, null, 2));
      console.log('Flow address being sent:', flowAddress);
      console.log('Flow address type:', typeof flowAddress);
      
      const response = await fetch('/api/match/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join match');
      }

      const data = await response.json();
      
      // Show success feedback briefly before redirecting
      setTimeout(() => {
        router.push(`/match/${data.match.id}`);
      }, 500);
      
    } catch (err) {
      console.error('Error joining match:', err);
      setError(err instanceof Error ? err.message : 'Failed to join match');
    } finally {
      setIsJoining(false);
    }
  };

  const canJoin = matchId.trim() && selectedNFT && matchInfo && !rarityError && !isJoining;

  return (
    <>
      <Navbar />
      <div style={{ 
        minHeight: '100vh',
        paddingTop: '4rem'
      }}>
        <Container>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '2rem',
            paddingTop: '2rem'
          }}>
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
            <h1 style={{
              fontSize: '2.5rem',
              fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
              fontWeight: 700,
              color: '#F8F9FA',
              textAlign: 'center'
            }}>
              ⚔️ Join Match
            </h1>
            <div style={{ width: '120px' }}></div>
          </div>

          {/* Match ID Input */}
          <div style={{ marginBottom: '1.5rem' }}>
            <Card>
              <h2 style={{
                fontSize: '1.5rem',
                fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                fontWeight: 700,
                color: '#F8F9FA',
                marginBottom: '1rem'
              }}>
                Enter Match ID
              </h2>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={matchId}
                  onChange={(e) => setMatchId(e.target.value)}
                  placeholder="Enter the match ID..."
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#F8F9FA',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#FF6E00'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
                />
                {isLoadingMatch && (
                  <div style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '0.75rem'
                  }}>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Error Display */}
          {error && (
            <div style={{ marginBottom: '1.5rem' }}>
              <Card className="bg-red-500/20 border border-red-500/30">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ color: '#F87171' }}>⚠️</div>
                  <span style={{ color: '#FECACA' }}>{error}</span>
                </div>
              </Card>
            </div>
          )}

          {/* Match Info Display */}
          {matchInfo && (
            <div style={{ marginBottom: '1.5rem' }}>
              <Card>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                  fontWeight: 700,
                  color: '#F8F9FA',
                  marginBottom: '1rem'
                }}>
                  Match Details
                </h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1.5rem'
                }}>
                  <div>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                      fontWeight: 700,
                      color: '#F8F9FA',
                      marginBottom: '0.5rem'
                    }}>
                      Opponent
                    </h3>
                    <p style={{ color: '#00C176' }}>{truncateName(matchInfo.playerA.name)}</p>
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                      fontWeight: 700,
                      color: '#F8F9FA',
                      marginBottom: '0.5rem'
                    }}>
                      Staked NFT
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '4rem',
                        height: '5rem',
                        borderRadius: '0.5rem',
                        overflow: 'hidden'
                      }}>
                        <Image
                          src={matchInfo.nftA.image}
                          alt={matchInfo.nftA.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          width={100}
                          height={100}
                        />
                      </div>
                      <div>
                        <p style={{
                          color: '#F8F9FA',
                          fontWeight: 500,
                          marginBottom: '0.25rem'
                        }}>
                          {matchInfo.nftA.name}
                        </p>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          ...(matchInfo.nftA.rarity?.toLowerCase() === 'legendary' ? 
                            { backgroundColor: 'rgba(251, 191, 36, 0.2)', color: '#FBBF24' } :
                            matchInfo.nftA.rarity?.toLowerCase() === 'epic' ? 
                            { backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#A855F7' } :
                            matchInfo.nftA.rarity?.toLowerCase() === 'rare' ? 
                            { backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6' } :
                            { backgroundColor: 'rgba(156, 163, 175, 0.2)', color: '#9CA3AF' })
                        }}>
                          {matchInfo.nftA.rarity}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  backgroundColor: 'rgba(0, 193, 118, 0.1)',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(0, 193, 118, 0.2)'
                }}>
                  <p style={{ color: '#00C176', fontSize: '0.875rem' }}>
                    💡 <strong>Match Requirements:</strong> You need to select an NFT with <strong>{matchInfo.nftA.rarity}</strong> rarity to join this match.
                  </p>
                </div>
              </Card>
            </div>
          )}

          {/* NFT Selection */}
          {matchInfo && (
            <div style={{ marginBottom: '1.5rem' }}>
              <Card>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                  fontWeight: 700,
                  color: '#F8F9FA',
                  marginBottom: '1rem'
                }}>
                  Select Your NFT to Stake
                </h2>
                <p style={{
                  color: '#D1D5DB',
                  marginBottom: '1.5rem',
                  lineHeight: '1.5'
                }}>
                  Choose an NFT with <strong>{matchInfo.nftA.rarity}</strong> rarity to match your opponent.
                </p>
                
                <NFTSelector
                  selectedNFT={selectedNFT}
                  onSelect={setSelectedNFT}
                />
              </Card>
            </div>
          )}

          {/* Rarity Error */}
          {rarityError && (
            <div style={{ marginBottom: '1.5rem' }}>
              <Card className="bg-red-500/20 border border-red-500/30">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ color: '#F87171' }}>⚠️</div>
                  <span style={{ color: '#FECACA' }}>{rarityError}</span>
                </div>
              </Card>
            </div>
          )}

          {/* Success Indicator */}
          {selectedNFT && matchInfo && !rarityError && (
            <div style={{ marginBottom: '1.5rem' }}>
              <Card className="bg-green-500/20 border border-green-500/30">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ color: '#10B981' }}>✅</div>
                  <span style={{ color: '#A7F3D0' }}>Perfect match! Ready to join the battle.</span>
                </div>
              </Card>
            </div>
          )}

          {/* Join Button */}
          <div style={{ textAlign: 'center' }}>
            {momentsLoading ? (
              <LoadingSpinner size="lg" text="Loading your Flow address..." />
            ) : (
              <AnimatedButton
                onClick={handleJoinMatch}
                disabled={!canJoin}
                variant="primary"
                size="lg"
              >
                {isJoining ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Joining Match...</span>
                  </div>
                ) : (
                  <>⚔️ Join Battle</>
                )}
              </AnimatedButton>
            )}
            
            {!matchId.trim() && (
              <p style={{ color: '#D1D5DB', marginTop: '1rem', opacity: 0.8 }}>
                Enter a match ID to get started
              </p>
            )}
            {matchId.trim() && !selectedNFT && matchInfo && (
              <p style={{ color: '#D1D5DB', marginTop: '1rem', opacity: 0.8 }}>
                Select an NFT to stake in the arena
              </p>
            )}
          </div>
        </Container>
      </div>
    </>
  );
} 