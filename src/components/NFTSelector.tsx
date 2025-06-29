'use client';

import { useState } from 'react';
import { NFT } from '@/types';
import { MOCK_NFTS } from '@/lib/mockData';
import { useUserMoments } from '@/hooks/useUserMoments';
import Image from 'next/image';

interface NFTSelectorProps {
  selectedNFT: NFT | null;
  onSelect: (nft: NFT) => void;
  className?: string;
  compact?: boolean;
}

const ITEMS_PER_PAGE = 8; // 2x4 grid

export default function NFTSelector({ selectedNFT, onSelect, className = '', compact = false }: NFTSelectorProps) {
  const [filter, setFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(0);
  const { moments, isLoading, error } = useUserMoments();

  // Convert user moments to NFT format, fallback to mock data if no real moments
  const userNFTs: (NFT & { title?: string; imageURL?: string; contract?: string; serialNumber?: number; dapp?: { name?: string }; description?: string })[] = 
    moments.length > 0 ? moments.map(moment => ({
      id: moment.id,
      name: moment.name,
      image: moment.image,
      rarity: moment.rarity,
      collection: moment.collection || 'NBA Top Shot',
      // Include original moment data for API processing
      title: moment.name,
      imageURL: moment.image,
      contract: 'A.877931736ee77cff.TopShot', // Use the actual TopShot contract
      serialNumber: moment.serialNumber
    })) : MOCK_NFTS;

  // Filter NFTs by TopShot contract first, then by rarity
  const topShotNFTs = userNFTs.filter(nft => {
    // Only include TopShot moments, exclude PackNFT (packs)
    const isTopShotMoment = nft.contract === 'A.877931736ee77cff.TopShot';
    const isNotPack = nft.contract !== 'A.877931736ee77cff.PackNFT' && 
                      !nft.title?.includes('NBA Top Shot Pack') &&
                      !nft.description?.includes('Reveals official NBA Top Shot Moments when opened');
    
    return isTopShotMoment && isNotPack;
  });

  const filteredNFTs = filter === 'all' 
    ? topShotNFTs 
    : topShotNFTs.filter(nft => nft.rarity?.toLowerCase() === filter.toLowerCase());

  // Pagination logic
  const totalPages = Math.ceil(filteredNFTs.length / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const paginatedNFTs = filteredNFTs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset to first page when filter changes
  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setCurrentPage(0);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'ultimate':
        return 'border-red-400 bg-red-400/10';
      case 'legendary':
        return 'border-yellow-400 bg-yellow-400/10';
      case 'rare':
        return 'border-blue-400 bg-blue-400/10';
      case 'fandom':
        return 'border-teal-400 bg-teal-400/10';
      case 'common':
        return 'border-green-400 bg-green-400/10';
      default:
        return 'border-gray-400 bg-gray-400/10';
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="text-center py-12">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-white text-lg">Loading your NBA moments...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={`w-full ${className}`}>
        <div className="text-center py-12">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-white text-lg">Error loading moments: {error}</p>
          <p className="text-gray-400 text-sm mt-2">Using mock data for now</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Status Message */}
      {moments.length === 0 && !isLoading && !error && (
        <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
          <p className="text-yellow-200 text-sm">
            🎮 Using demo TopShot NFTs - your real Dapper moments will load here once authenticated
          </p>
        </div>
      )}
      


      {moments.length > 0 && topShotNFTs.length === 0 && (
        <div className="mb-4 p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg">
          <p className="text-orange-200 text-sm">
            ⚠️ No TopShot moments found in your {moments.length} items. Only opened TopShot moments (not packs) can be used in this game.
          </p>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'common', 'fandom', 'rare', 'legendary', 'ultimate'].map((rarity) => (
          <button
            key={rarity}
            onClick={() => handleFilterChange(rarity)}
            className={`px-4 py-2 rounded-lg font-medium capitalize transition-all ${
              filter === rarity
                ? 'bg-orange-500 text-white'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {rarity}
          </button>
        ))}
      </div>

      {/* NFT Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {paginatedNFTs.map((nft) => {
          const isWithdrawInProgress = nft.isWithdrawInProgress;
          const isDisabled = isWithdrawInProgress;
          
          return (
            <div
              key={nft.id}
              onClick={() => !isDisabled && onSelect(nft)}
              className={`relative group rounded-xl overflow-hidden transition-all duration-300 ${
                isDisabled 
                  ? 'opacity-50 cursor-not-allowed'
                  : selectedNFT?.id === nft.id
                    ? 'ring-4 ring-orange-400 scale-105 cursor-pointer'
                    : 'hover:scale-105 cursor-pointer'
              } ${getRarityColor(nft.rarity || 'common')}`}
            >
            {/* NFT Image */}
            <div className="aspect-[3/4] relative">
              <Image
                src={nft.image}
                alt={nft.name}
                className="w-full h-full object-cover"
                width={100}
                height={100}
              />
              
              {/* Selection Overlay */}
              {selectedNFT?.id === nft.id && (
                <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
                  <div className="text-white text-2xl">✓</div>
                </div>
              )}
            </div>

            {/* NFT Info */}
            <div className="p-4 bg-black/50 backdrop-blur-sm">
              <h3 className="font-bold text-white text-sm truncate">{nft.name}</h3>
              <div className="mt-2">
                <p className="text-xs text-gray-300 truncate mb-2">
                  {nft.description || nft.collection}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">#{nft.serialNumber || 'N/A'}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    nft.rarity?.toLowerCase() === 'ultimate' ? 'bg-red-400/20 text-red-400' :
                    nft.rarity?.toLowerCase() === 'legendary' ? 'bg-yellow-400/20 text-yellow-400' :
                    nft.rarity?.toLowerCase() === 'rare' ? 'bg-blue-400/20 text-blue-400' :
                    nft.rarity?.toLowerCase() === 'fandom' ? 'bg-teal-400/20 text-teal-400' :
                    nft.rarity?.toLowerCase() === 'common' ? 'bg-green-400/20 text-green-400' :
                    'bg-gray-400/20 text-gray-400'
                  }`}>
                    {nft.rarity}
                  </span>
                </div>
              </div>
            </div>

            {/* Withdrawal Status Overlay */}
            {isWithdrawInProgress && (
              <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="text-2xl mb-1">🔄</div>
                  <div className="text-xs font-medium">TRANSFERRING</div>
                </div>
              </div>
            )}
          </div>
        );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          marginTop: '1.5rem'
        }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
            className={`px-3 py-2 rounded-lg font-medium transition-all ${
              currentPage === 0
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            ←
          </button>
          
          <span className="text-white font-medium">
            Page {currentPage + 1} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
            disabled={currentPage === totalPages - 1}
            className={`px-3 py-2 rounded-lg font-medium transition-all ${
              currentPage === totalPages - 1
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            →
          </button>
        </div>
      )}

      {paginatedNFTs.length === 0 && filteredNFTs.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-white text-lg">No NFTs found for this filter</p>
          {filter !== 'all' && (
            <button
              onClick={() => handleFilterChange('all')}
              className="mt-2 text-orange-400 hover:text-orange-300 underline"
            >
              Clear filter
            </button>
          )}
        </div>
      )}

      {paginatedNFTs.length === 0 && filteredNFTs.length > 0 && (
        <div className="text-center py-8">
          <p className="text-white text-lg">No more NFTs on this page</p>
          <button
            onClick={() => setCurrentPage(0)}
            className="mt-2 text-orange-400 hover:text-orange-300 underline"
          >
            Go to first page
          </button>
        </div>
      )}
    </div>
  );
} 