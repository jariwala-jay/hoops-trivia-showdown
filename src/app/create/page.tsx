'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NFTSelector from '@/components/NFTSelector';
import { NFT } from '@/types';
import toast from 'react-hot-toast';

export default function CreateMatchPage() {
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const handleCreateMatch = async () => {
    if (!selectedNFT) {
      toast.error('Please select an NFT to stake');
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch('/api/match/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nft: selectedNFT // Send the full NFT object
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create match');
      }

      toast.success('Match created successfully!');
      router.push(`/match/${data.matchId}`);
    } catch (error) {
      console.error('Error creating match:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create match');
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
                  <img
                    src={selectedNFT.image}
                    alt={selectedNFT.name}
                    className="w-full h-full object-cover"
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
              className={`px-8 py-4 rounded-xl font-bold text-xl transition-all ${
                !selectedNFT || isCreating
                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-400 to-red-500 text-white hover:from-orange-300 hover:to-red-400 hover:scale-105'
              }`}
            >
              {isCreating ? 'Creating Match...' : 'Create Match'}
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