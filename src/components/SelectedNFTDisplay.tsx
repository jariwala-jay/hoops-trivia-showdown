'use client';

import Image from 'next/image';
import { NFT } from '@/types';

interface SelectedNFTDisplayProps {
  nft: NFT;
  title?: string;
  showRarityInfo?: boolean;
  customMessage?: string;
  className?: string;
}

export default function SelectedNFTDisplay({ 
  nft, 
  title = "Selected NFT",
  showRarityInfo = false,
  customMessage,
  className = ""
}: SelectedNFTDisplayProps) {
  
  const getRarityStyle = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'ultimate':
        return { backgroundColor: 'rgba(248, 113, 113, 0.2)', color: '#F87171' };
      case 'legendary':
        return { backgroundColor: 'rgba(251, 191, 36, 0.2)', color: '#FBBF24' };
      case 'rare':
        return { backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6' };
      case 'fandom':
        return { backgroundColor: 'rgba(45, 212, 191, 0.2)', color: '#2DD4BF' };
      case 'common':
        return { backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#22C55E' };
      default:
        return { backgroundColor: 'rgba(156, 163, 175, 0.2)', color: '#9CA3AF' };
    }
  };

  return (
    <div className={className}>
      <h2 style={{
        fontSize: '1.5rem',
        fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
        fontWeight: 700,
        color: '#F8F9FA',
        marginBottom: '1rem'
      }}>
        {title}
      </h2>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          width: '6rem',
          height: '8rem',
          borderRadius: '0.5rem',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <Image
            src={nft.image}
            alt={nft.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            width={100}
            height={100}
          />
        </div>
        
        <div>
          <h3 style={{
            fontSize: '1.25rem',
            fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
            fontWeight: 700,
            color: '#F8F9FA',
            marginBottom: '0.25rem'
          }}>
            {nft.name}
          </h3>
          
          <p style={{ color: '#D1D5DB', marginBottom: '0.5rem' }}>
            {nft.collection}
          </p>
          
          <span style={{
            display: 'inline-block',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            fontSize: '0.875rem',
            fontWeight: 500,
            ...getRarityStyle(nft.rarity || 'common')
          }}>
            {nft.rarity}
          </span>
        </div>
      </div>
      
      {(showRarityInfo || customMessage) && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: 'rgba(255, 110, 0, 0.1)',
          borderRadius: '0.5rem',
          border: '1px solid rgba(255, 110, 0, 0.2)'
        }}>
          <p style={{ color: '#FF6E00', fontSize: '0.875rem' }}>
            {customMessage || (
              <>
                💡 <strong>Arena Rules:</strong> Only players with {nft.rarity} rarity NFTs can join this match. 
                Your opponent must stake an NFT of the same rarity level.
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
} 