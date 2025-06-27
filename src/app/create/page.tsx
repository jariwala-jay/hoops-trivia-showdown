'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NFTSelector from '@/components/NFTSelector';
import { NFT } from '@/types';
import toast from 'react-hot-toast';
import Image from 'next/image';
export default function CreateMatchPage() {
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCreateMatch = async () => {
    if (!selectedNFT) {
      toast.error('Please select an NFT to stake');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/match/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nft: selectedNFT,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create match');
      }

      const data = await response.json();
      
      // Show success feedback briefly before redirecting
      setTimeout(() => {
        router.push(`/match/${data.matchId}`);
      }, 500);
      
    } catch (err) {
      console.error('Error creating match:', err);
      setError(err instanceof Error ? err.message : 'Failed to create match');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-red-600">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            href="/" 
            className="text-white hover:text-orange-200 transition-colors"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-white">Create Match</h1>
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>

        <div className="max-w-6xl mx-auto">
          {error && (
            <div className="mb-6 mx-auto max-w-md">
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <div className="text-red-400">⚠️</div>
                  <span className="text-red-200">{error}</span>
                </div>
              </div>
            </div>
          )}

          {/* NFT Selection */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Select Your NFT to Stake</h2>
            <p className="text-orange-100 mb-6">
              Choose the NFT you want to stake in this match. Winner takes all!
            </p>
            
            <NFTSelector
              selectedNFT={selectedNFT}
              onSelect={setSelectedNFT}
            />
          </div>

          {/* Selected NFT Preview */}
          {selectedNFT && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8">
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
                  <p className="text-orange-100">{selectedNFT.collection}</p>
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
            </div>
          )}

          {/* Create Button */}
          <div className="text-center">
            <button
              onClick={handleCreateMatch}
              disabled={!selectedNFT || isCreating}
              className={`px-8 py-4 rounded-xl font-bold text-xl transition-all duration-200 ${
                !selectedNFT || isCreating
                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                  : 'bg-orange-500 text-white hover:bg-orange-400 transform hover:scale-105 shadow-lg hover:shadow-xl'
              }`}
            >
              {isCreating ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Creating Match...</span>
                </div>
              ) : (
                <>
                  🚀 Create Match
                </>
              )}
            </button>
            
            {!selectedNFT && (
              <p className="text-orange-200 mt-4">
                Select an NFT to stake
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 