'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NFTSelector from '@/components/NFTSelector';
import { NFT, Match } from '@/types';
import Image from 'next/image';

export default function JoinMatchPage() {
  const [matchId, setMatchId] = useState('');
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isLoadingMatch, setIsLoadingMatch] = useState(false);
  const [matchInfo, setMatchInfo] = useState<Match | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rarityError, setRarityError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch match info when matchId changes
  useEffect(() => {
    const fetchMatchInfo = async () => {
      if (!matchId.trim()) {
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

    setIsJoining(true);
    setError(null);

    try {
      const response = await fetch('/api/match/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          matchId: matchId.trim(),
          nft: selectedNFT,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join match');
      }

      const data = await response.json();
      
      // Show success feedback briefly before redirecting
      setTimeout(() => {
        router.push(`/match/${data.matchId}`);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            href="/" 
            className="text-white hover:text-blue-200 transition-colors"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-white">Join Match</h1>
          <div className="w-24"></div>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Match ID Input */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">Enter Match ID</h2>
            <div className="relative">
              <input
                type="text"
                value={matchId}
                onChange={(e) => setMatchId(e.target.value)}
                placeholder="Enter the match ID..."
                className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/50 border border-white/30 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
              />
              {isLoadingMatch && (
                <div className="absolute right-3 top-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              )}
            </div>
          </div>

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

          {/* Match Info Display */}
          {matchInfo && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
              <h2 className="text-2xl font-bold text-white mb-4">Match Details</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Opponent</h3>
                  <p className="text-blue-100">{matchInfo.playerA.name}</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Staked NFT</h3>
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-20 rounded-lg overflow-hidden">
                      <Image
                        src={matchInfo.nftA.image}
                        alt={matchInfo.nftA.name}
                        className="w-full h-full object-cover"
                        width={100}
                        height={100}
                      />
                    </div>
                    <div>
                      <p className="text-white font-medium">{matchInfo.nftA.name}</p>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        matchInfo.nftA.rarity?.toLowerCase() === 'legendary' ? 'bg-yellow-400/20 text-yellow-400' :
                        matchInfo.nftA.rarity?.toLowerCase() === 'epic' ? 'bg-purple-400/20 text-purple-400' :
                        matchInfo.nftA.rarity?.toLowerCase() === 'rare' ? 'bg-blue-400/20 text-blue-400' :
                        'bg-gray-400/20 text-gray-400'
                      }`}>
                        {matchInfo.nftA.rarity}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-blue-500/20 rounded-lg">
                <p className="text-blue-200 text-sm">
                  💡 <strong>Tip:</strong> You need to select an NFT with <strong>{matchInfo.nftA.rarity}</strong> rarity to join this match.
                </p>
              </div>
            </div>
          )}

          {/* NFT Selection */}
          {matchInfo && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
              <h2 className="text-2xl font-bold text-white mb-4">Select Your NFT to Stake</h2>
              <p className="text-blue-100 mb-6">
                Choose an NFT with <strong>{matchInfo.nftA.rarity}</strong> rarity to match your opponent.
              </p>
              
              <NFTSelector
                selectedNFT={selectedNFT}
                onSelect={setSelectedNFT}
              />
            </div>
          )}

          {/* Rarity Error */}
          {rarityError && (
            <div className="mb-6">
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <div className="text-red-400">⚠️</div>
                  <span className="text-red-200">{rarityError}</span>
                </div>
              </div>
            </div>
          )}

          {/* Success Indicator */}
          {selectedNFT && matchInfo && !rarityError && (
            <div className="mb-6">
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <div className="text-green-400">✅</div>
                  <span className="text-green-200">Perfect match! Ready to join the battle.</span>
                </div>
              </div>
            </div>
          )}

          {/* Join Button */}
          <div className="text-center">
            <button
              onClick={handleJoinMatch}
              disabled={!canJoin}
              className={`px-8 py-4 rounded-xl font-bold text-xl transition-all duration-200 ${
                !canJoin
                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-400 transform hover:scale-105 shadow-lg hover:shadow-xl'
              }`}
            >
              {isJoining ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Joining Match...</span>
                </div>
              ) : (
                <>
                  ⚔️ Join Battle
                </>
              )}
            </button>
            
            {!matchId.trim() && (
              <p className="text-blue-200 mt-4">
                Enter a match ID to get started
              </p>
            )}
            {matchId.trim() && !selectedNFT && matchInfo && (
              <p className="text-blue-200 mt-4">
                Select an NFT to stake
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 