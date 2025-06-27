'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NFTSelector from '@/components/NFTSelector';
import { NFT } from '@/types';
import Image from 'next/image';
export default function AutomatchPage() {
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [queueSize, setQueueSize] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(20);
  const [error, setError] = useState<string | null>(null);
  const [matchFound, setMatchFound] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const router = useRouter();
  
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
      const eventSource = new EventSource(`/api/match/automatch/stream?nft=${nftParam}&rarity=${rarityParam}`);
      
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('[SSE] Connected to automatch service');
        setConnectionStatus('connected');
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[SSE] Received:', data);

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
              console.log('[SSE] Unknown message type:', data.type);
          }
        } catch (err) {
          console.error('[SSE] Error parsing message:', err);
        }
      };

      eventSource.onerror = (event) => {
        console.log('[SSE] Connection closed or error:', event);
        
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
      <div className="min-h-screen bg-gradient-to-br from-green-500 to-blue-600">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8">
              <div className="text-6xl mb-4 animate-bounce">🎉</div>
              <h1 className="text-4xl font-bold text-white mb-4">Match Found!</h1>
              <p className="text-green-100 text-xl">
                Opponent found! Redirecting to match...
              </p>
              <div className="mt-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-600">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            href="/" 
            className="text-white hover:text-purple-200 transition-colors"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-white">Quick Match</h1>
          <div className="w-24"></div>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Error Display */}
          {error && (
            <div className="mb-6">
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <div className="text-red-400">⚠️</div>
                  <span className="text-red-200">{error}</span>
                </div>
              </div>
            </div>
          )}

          {/* Searching Status */}
          {isSearching && (
            <div className="mb-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
                <div className="text-4xl mb-4 animate-pulse">🔍</div>
                <h2 className="text-2xl font-bold text-white mb-2">Searching for Opponent...</h2>
                <p className="text-purple-100 mb-4">
                  Looking for players with <strong>{selectedNFT?.rarity}</strong> rarity NFTs
                </p>
                
                {/* Connection Status */}
                <div className="mb-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                    connectionStatus === 'connected' ? 'bg-green-500/20 text-green-400' :
                    connectionStatus === 'connecting' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {connectionStatus === 'connected' ? '🟢 Connected' :
                     connectionStatus === 'connecting' ? '🟡 Connecting...' :
                     '🔴 Disconnected'}
                  </span>
                </div>
                
                <div className="bg-black/20 rounded-lg p-4 mb-4">
                  <div className="text-3xl font-bold text-white mb-2">{timeRemaining}s</div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-purple-400 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${(timeRemaining / 20) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {queueSize > 0 && (
                  <p className="text-purple-200 mb-4">
                    {queueSize} player(s) in queue for {selectedNFT?.rarity} rarity
                  </p>
                )}

                <button
                  onClick={cancelSearch}
                  className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-400 transition-colors"
                >
                  Cancel Search
                </button>
              </div>
            </div>
          )}

          {/* NFT Selection */}
          {!isSearching && (
            <>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
                <h2 className="text-2xl font-bold text-white mb-4">Select Your NFT to Stake</h2>
                <p className="text-purple-100 mb-6">
                  Choose an NFT to stake. You&apos;ll be matched with opponents who have NFTs of the same rarity.
                </p>
                
                <NFTSelector
                  selectedNFT={selectedNFT}
                  onSelect={setSelectedNFT}
                />
              </div>

              {/* Selected NFT Preview */}
              {selectedNFT && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
                  <h2 className="text-2xl font-bold text-white mb-4">Selected NFT</h2>
                  <div className="flex items-center space-x-4">
                    <div className="w-24 h-32 relative rounded-lg overflow-hidden">
                    <Image
                        src={selectedNFT.image}
                        alt={selectedNFT.name}
                        className="w-full h-full object-cover"
                        width={100}
                        height={100}
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{selectedNFT.name}</h3>
                      <p className="text-purple-100">{selectedNFT.collection}</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                        selectedNFT.rarity?.toLowerCase() === 'legendary' ? 'bg-yellow-400/20 text-yellow-400' :
                        selectedNFT.rarity?.toLowerCase() === 'epic' ? 'bg-purple-400/20 text-purple-400' :
                        selectedNFT.rarity?.toLowerCase() === 'rare' ? 'bg-blue-400/20 text-blue-400' :
                        'bg-gray-400/20 text-gray-400'
                      }`}>
                        {selectedNFT.rarity}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-purple-500/20 rounded-lg">
                    <p className="text-purple-200 text-sm">
                      💡 <strong>Real-time Matching:</strong> You&apos;ll be instantly notified when an opponent with <strong>{selectedNFT.rarity}</strong> rarity NFTs joins. 
                      No more waiting or refreshing!
                    </p>
                  </div>
                </div>
              )}

              {/* Start Button */}
              <div className="text-center">
                <button
                  onClick={startAutomatch}
                  disabled={!selectedNFT}
                  className={`px-8 py-4 rounded-xl font-bold text-xl transition-all duration-200 ${
                    !selectedNFT
                      ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                      : 'bg-purple-500 text-white hover:bg-purple-400 transform hover:scale-105 shadow-lg hover:shadow-xl'
                  }`}
                >
                  ⚡ Find Quick Match
                </button>
                
                {!selectedNFT && (
                  <p className="text-purple-200 mt-4">
                    Select an NFT to start matchmaking
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 