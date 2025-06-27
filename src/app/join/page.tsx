'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NFTSelector from '@/components/NFTSelector';
import { NFT } from '@/types';
import toast from 'react-hot-toast';

export default function JoinMatchPage() {
  const [matchId, setMatchId] = useState('');
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [matchInfo, setMatchInfo] = useState<{ requiredRarity?: string; playerName?: string } | null>(null);
  const [rarityError, setRarityError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch match info to get required rarity
  const fetchMatchInfo = async (id: string) => {
    if (!id.trim()) {
      setMatchInfo(null);
      setRarityError(null);
      return;
    }

    try {
      const response = await fetch(`/api/match/${id.trim()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.match) {
          setMatchInfo({
            requiredRarity: data.match.nftA?.rarity,
            playerName: data.match.playerA?.name
          });
          setRarityError(null);
        }
      } else {
        setMatchInfo(null);
        setRarityError(null);
      }
    } catch (error) {
      console.error('Error fetching match info:', error);
      setMatchInfo(null);
      setRarityError(null);
    }
  };

  const handleJoinMatch = async () => {
    if (!matchId.trim()) {
      toast.error('Please enter a match ID');
      return;
    }

    if (!selectedNFT) {
      toast.error('Please select an NFT to stake');
      return;
    }

    setIsJoining(true);

    try {
      const response = await fetch('/api/match/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          matchId: matchId.trim(),
          nft: selectedNFT // Send the full NFT object
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle rarity mismatch specifically
        if (data.requiredRarity && data.providedRarity) {
          setRarityError(data.error);
          toast.error(data.error);
        } else {
          throw new Error(data.error || 'Failed to join match');
        }
        return;
      }

      toast.success('Successfully joined match!');
      router.push(`/match/${matchId.trim()}`);
    } catch (error) {
      console.error('Error joining match:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to join match');
      setRarityError(null);
    } finally {
      setIsJoining(false);
    }
  };

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
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Match ID Input */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Enter Match ID</h2>
            <p className="text-blue-100 mb-4">
              Get the match ID from your opponent and enter it below
            </p>
            <div className="max-w-md">
              <input
                type="text"
                value={matchId}
                onChange={(e) => {
                  setMatchId(e.target.value);
                  setRarityError(null);
                  fetchMatchInfo(e.target.value);
                }}
                placeholder="Enter match ID (e.g., 123e4567-e89b-12d3-a456-426614174000)"
                className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>
            
            {/* Match Info Display */}
            {matchInfo && (
              <div className="mt-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                <h3 className="text-green-200 font-semibold mb-2">Match Found!</h3>
                <p className="text-green-100 text-sm">
                  Challenge from: <span className="font-medium">{matchInfo.playerName}</span>
                </p>
                <p className="text-green-100 text-sm">
                  Required NFT Rarity: <span className="font-medium capitalize">{matchInfo.requiredRarity === 'Common' ? 'Fandom' : matchInfo.requiredRarity}</span>
                </p>
              </div>
            )}

            {/* Rarity Error Display */}
            {rarityError && (
              <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                <h3 className="text-red-200 font-semibold mb-2">⚠️ Rarity Mismatch</h3>
                <p className="text-red-100 text-sm">{rarityError}</p>
                <p className="text-red-100 text-sm mt-2">
                  Please select an NFT with the correct rarity to join this match.
                </p>
              </div>
            )}
          </div>

          {/* NFT Selection */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Select Your NFT to Stake</h2>
            <p className="text-blue-100 mb-6">
              Choose the NFT you want to stake in this match. Winner takes all!
            </p>
            
            {/* Rarity Filter Hint */}
            {matchInfo?.requiredRarity && (
              <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                                 <p className="text-blue-200 text-sm">
                   💡 <strong>Tip:</strong> Filter by &ldquo;{matchInfo.requiredRarity === 'Common' ? 'Fandom' : matchInfo.requiredRarity}&rdquo; to see only compatible NFTs for this match.
                 </p>
              </div>
            )}
            
            <NFTSelector
              selectedNFT={selectedNFT}
              onSelect={(nft) => {
                setSelectedNFT(nft);
                setRarityError(null); // Clear any previous rarity errors when selecting
              }}
            />
          </div>

          {/* Selected NFT Preview */}
          {selectedNFT && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Selected NFT</h2>
              <div className="flex items-center space-x-4">
                <div className="w-24 h-32 relative rounded-lg overflow-hidden">
                  <img
                    src={selectedNFT.image}
                    alt={selectedNFT.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedNFT.name}</h3>
                  <p className="text-blue-100">{selectedNFT.collection}</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                    selectedNFT.rarity?.toLowerCase() === 'legendary' ? 'bg-yellow-400/20 text-yellow-400' :
                    selectedNFT.rarity?.toLowerCase() === 'epic' ? 'bg-purple-400/20 text-purple-400' :
                    selectedNFT.rarity?.toLowerCase() === 'rare' ? 'bg-blue-400/20 text-blue-400' :
                    selectedNFT.rarity?.toLowerCase() === 'common' ? 'bg-green-400/20 text-green-400' :
                    'bg-gray-400/20 text-gray-400'
                  }`}>
                    {selectedNFT.rarity === 'Common' ? 'Fandom' : selectedNFT.rarity}
                  </span>
                  
                  {/* Rarity compatibility indicator */}
                  {matchInfo?.requiredRarity && selectedNFT.rarity !== matchInfo.requiredRarity && (
                    <div className="mt-2 text-red-400 text-sm">
                      ⚠️ This NFT won&apos;t work - requires {matchInfo.requiredRarity === 'Common' ? 'Fandom' : matchInfo.requiredRarity} rarity
                    </div>
                  )}
                  {matchInfo?.requiredRarity && selectedNFT.rarity === matchInfo.requiredRarity && (
                    <div className="mt-2 text-green-400 text-sm">
                      ✅ Perfect match!
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Join Button */}
          <div className="text-center">
            <button
              onClick={handleJoinMatch}
              disabled={!matchId.trim() || !selectedNFT || isJoining}
              className={`px-8 py-4 rounded-xl font-bold text-xl transition-all ${
                !matchId.trim() || !selectedNFT || isJoining
                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-400 to-purple-500 text-white hover:from-blue-300 hover:to-purple-400 hover:scale-105'
              }`}
            >
              {isJoining ? 'Joining Match...' : 'Join Match'}
            </button>
            
            {(!matchId.trim() || !selectedNFT) && (
              <p className="text-blue-200 mt-4">
                Enter match ID and select an NFT to continue
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 