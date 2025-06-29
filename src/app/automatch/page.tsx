'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NFTSelector from '@/components/NFTSelector';
import Navbar from '@/components/Navbar';
import Container from '@/components/Container';
import Card from '@/components/Card';
import AnimatedButton from '@/components/AnimatedButton';
import LoadingSpinner from '@/components/LoadingSpinner';
import AuthGuard from '@/components/AuthGuard';
import { NFT } from '@/types';
import { useUserMoments } from '@/hooks/useUserMoments';
import SelectedNFTDisplay from '@/components/SelectedNFTDisplay';

export default function AutomatchPage() {
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [queueSize, setQueueSize] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(20);
  const [error, setError] = useState<string | null>(null);
  const [matchFound, setMatchFound] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const router = useRouter();
  const { flowAddress, isLoading: momentsLoading } = useUserMoments();
  
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    if (isSearching && timeRemaining > 0) {
      countdownRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isSearching, timeRemaining]);

  const startAutomatch = async () => {
    if (!selectedNFT) return;

    if (!flowAddress) {
      setError('Flow address not available. Please try again.');
      return;
    }

    setIsSearching(true);
    setError(null);
    setTimeRemaining(20);
    setQueueSize(0);
    setConnectionStatus('connecting');

    try {
      // Close any existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Create SSE connection
      const nftParam = encodeURIComponent(JSON.stringify(selectedNFT));
      const rarityParam = encodeURIComponent(selectedNFT.rarity || 'Common');
      const flowAddressParam = encodeURIComponent(flowAddress);
      const eventSource = new EventSource(`/api/match/automatch/stream?nft=${nftParam}&rarity=${rarityParam}&flowAddress=${flowAddressParam}`);
      
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setConnectionStatus('connected');
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'connected':
              setConnectionStatus('connected');
              break;

            case 'queued':
              setQueueSize(data.queueSize || 1);
              break;

            case 'queue_update':
              setQueueSize(data.queueSize || 0);
              break;

            case 'match_found':
              setMatchFound(true);
              setIsSearching(false);
              setConnectionStatus('disconnected');
              
              // Show success feedback briefly before redirecting
              setTimeout(() => {
                router.push(`/match/${data.matchId}`);
              }, 1500);
              break;

            case 'timeout':
              setError(data.message || 'No opponents found at the moment. Try again later!');
              setIsSearching(false);
              setConnectionStatus('disconnected');
              if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
              }
              break;

            case 'error':
              setError(data.message || 'An error occurred during matchmaking');
              setIsSearching(false);
              setConnectionStatus('disconnected');
              break;

            default:
              console.warn('[SSE] Unknown message type:', data.type);
          }
        } catch (err) {
          console.error('[SSE] Error parsing message:', err);
        }
      };

      eventSource.onerror = (event) => {
        console.warn('[SSE] Connection closed or error:', event);
        
        // Only show error if we're still actively searching
        if (isSearching && !matchFound) {
          setError('Connection error. Please try again.');
        }
        
        setIsSearching(false);
        setConnectionStatus('disconnected');
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
      };

    } catch (err) {
      console.error('Error starting automatch:', err);
      setError(err instanceof Error ? err.message : 'Failed to start automatch');
      setIsSearching(false);
      setConnectionStatus('disconnected');
    }
  };

  const cancelSearch = async () => {
    setIsSearching(false);
    setError(null);
    setTimeRemaining(20);
    setConnectionStatus('disconnected');
    
    // Close SSE connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Clear countdown timer
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
  };

  if (matchFound) {
    return (
      <>
        <Navbar />
        <div style={{ 
          minHeight: '100vh',
          paddingTop: '4rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Container size="sm">
            <div style={{ textAlign: 'center' }}>
              <Card>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }} className="animate-bounce">🎉</div>
                <h1 style={{
                  fontSize: '2.5rem',
                  fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                  fontWeight: 700,
                  color: '#F8F9FA',
                  marginBottom: '1rem'
                }}>
                  Match Found!
                </h1>
                <p style={{
                  color: '#00C176',
                  fontSize: '1.25rem',
                  marginBottom: '1.5rem'
                }}>
                  Opponent found! Redirecting to match...
                </p>
                <div style={{ marginTop: '1.5rem' }}>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                </div>
              </Card>
            </div>
          </Container>
        </div>
      </>
    );
  }

  return (
    <AuthGuard>
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
              Quick Match
            </h1>
            <div style={{ width: '120px' }}></div>
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

          {/* Searching Status */}
          {isSearching && (
            <div style={{ marginBottom: '1.5rem' }}>
              <Card>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }} className="animate-pulse">🔍</div>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                    fontWeight: 700,
                    color: '#F8F9FA',
                    marginBottom: '0.5rem'
                  }}>
                    Searching for Opponent...
                  </h2>
                  <p style={{
                    color: '#D1D5DB',
                    marginBottom: '1rem'
                  }}>
                    Looking for players with <strong>{selectedNFT?.rarity}</strong> rarity NFTs
                  </p>
                  
                  {/* Connection Status */}
                  <div style={{ marginBottom: '1rem' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.875rem',
                      ...(connectionStatus === 'connected' ? 
                        { backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10B981' } :
                        connectionStatus === 'connecting' ? 
                        { backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B' } :
                        { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#EF4444' })
                    }}>
                      {connectionStatus === 'connected' ? '🟢 Connected' :
                       connectionStatus === 'connecting' ? '🟡 Connecting...' :
                       '🔴 Disconnected'}
                    </span>
                  </div>
                  
                  <div style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      fontSize: '2rem',
                      fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                      fontWeight: 700,
                      color: '#F8F9FA',
                      marginBottom: '0.5rem'
                    }}>
                      {timeRemaining}s
                    </div>
                    <div style={{
                      width: '100%',
                      backgroundColor: 'rgba(156, 163, 175, 0.3)',
                      borderRadius: '9999px',
                      height: '0.5rem'
                    }}>
                      <div 
                        style={{
                          backgroundColor: '#FF6E00',
                          height: '0.5rem',
                          borderRadius: '9999px',
                          transition: 'width 1s ease-in-out',
                          width: `${(timeRemaining / 20) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>

                  {queueSize > 0 && (
                    <p style={{
                      color: '#D1D5DB',
                      marginBottom: '1rem',
                      fontSize: '0.875rem'
                    }}>
                      {queueSize} player(s) in queue for {selectedNFT?.rarity} rarity
                    </p>
                  )}

                  <AnimatedButton
                    onClick={cancelSearch}
                    variant="secondary"
                    size="md"
                  >
                    Cancel Search
                  </AnimatedButton>
                </div>
              </Card>
            </div>
          )}
         

          {/* NFT Selection */}
          {!isSearching && (
            <>
              {/* Selected NFT and Action Button at Top */}
              {selectedNFT && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <Card>
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      gap: '1rem'
                    }}>
                      <SelectedNFTDisplay 
                        nft={selectedNFT}
                        title="Ready to Battle"
                        compact={true}
                        customMessage={`Matched with ${selectedNFT.rarity} rarity opponents`}
                      />
                      
                      <div style={{ 
                        display: 'flex', 
                        gap: '1rem',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                        paddingTop: '1rem'
                      }}>
                        {momentsLoading ? (
                          <LoadingSpinner size="md" text="Loading..." />
                        ) : (
                          <AnimatedButton
                            onClick={startAutomatch}
                            disabled={!selectedNFT || !flowAddress}
                            variant="primary"
                            size="lg"
                          >
                            Find Quick Match
                          </AnimatedButton>
                        )}
                        
                      </div>
                      
                      {!momentsLoading && !flowAddress && (
                        <div style={{
                          textAlign: 'center',
                          padding: '0.75rem',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          borderRadius: '0.5rem',
                          border: '1px solid rgba(239, 68, 68, 0.2)'
                        }}>
                          <p style={{ color: '#FECACA', margin: 0, fontSize: '0.875rem' }}>
                            ⚠️ Flow address not available. Please refresh the page.
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              )}

              <div style={{ marginBottom: '1.5rem' }}>
                <Card>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                    fontWeight: 700,
                    color: '#F8F9FA',
                    marginBottom: '1rem'
                  }}>
                    {selectedNFT ? 'Choose a Different NFT' : 'Select Your NFT to Stake'}
                  </h2>
                  <p style={{
                    color: '#D1D5DB',
                    marginBottom: '1.5rem',
                    lineHeight: '1.5'
                  }}>
                    Choose an NFT to stake. You&apos;ll be matched with opponents who have NFTs of the same rarity.
                  </p>
                  
                  <NFTSelector
                    selectedNFT={selectedNFT}
                    onSelect={setSelectedNFT}
                  />
                </Card>
              </div>

              
            </>
          )}
        </Container>
      </div>
    </AuthGuard>
  );
} 