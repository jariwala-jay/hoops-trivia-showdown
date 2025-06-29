'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NFTSelector from '@/components/NFTSelector';
import Navbar from '@/components/Navbar';
import Container from '@/components/Container';
import Card from '@/components/Card';
import AnimatedButton from '@/components/AnimatedButton';
import LoadingSpinner from '@/components/LoadingSpinner';
import { NFT } from '@/types';
import toast from 'react-hot-toast';
import { useUserMoments } from '@/hooks/useUserMoments';
import SelectedNFTDisplay from '@/components/SelectedNFTDisplay';

export default function CreateMatchPage() {
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { flowAddress, isLoading: momentsLoading } = useUserMoments();

  console.log('Create page - Flow address:', flowAddress);
  console.log('Create page - Moments loading:', momentsLoading);

  const handleCreateMatch = async () => {
    if (!selectedNFT) {
      toast.error('Please select an NFT to stake');
      return;
    }

    console.log('Attempting to create match with Flow address:', flowAddress);

    if (!flowAddress) {
      toast.error('Flow address not available. Please try again.');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const requestBody = {
        nft: selectedNFT,
        flowAddress: flowAddress,
      };
      
      console.log('=== CREATE MATCH REQUEST DEBUG ===');
      console.log('Request body being sent:', JSON.stringify(requestBody, null, 2));
      console.log('Flow address being sent:', flowAddress);
      console.log('Flow address type:', typeof flowAddress);
      
      const response = await fetch('/api/match/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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
              🚀 Create Match
            </h1>
            <div style={{ width: '120px' }}></div>
          </div>

          {/* Error Display */}
          {error && (
            <div style={{ marginBottom: '1.5rem', maxWidth: '28rem', margin: '0 auto 1.5rem auto' }}>
              <Card className="bg-red-500/20 border border-red-500/30">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ color: '#F87171' }}>⚠️</div>
                  <span style={{ color: '#FECACA' }}>{error}</span>
                </div>
              </Card>
            </div>
          )}

          {/* NFT Selection */}
          <div style={{ marginBottom: '2rem' }}>
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
                Choose the NFT you want to stake in this match. Winner takes all!
              </p>
              
              <NFTSelector
                selectedNFT={selectedNFT}
                onSelect={setSelectedNFT}
              />
            </Card>
          </div>

          {/* Selected NFT Preview */}
          {selectedNFT && (
            <div style={{ marginBottom: '2rem' }}>
              <Card>
                <SelectedNFTDisplay 
                  nft={selectedNFT}
                  showRarityInfo={true}
                />
              </Card>
            </div>
          )}

          {/* Create Button */}
          <div style={{ textAlign: 'center' }}>
            {momentsLoading ? (
              <LoadingSpinner size="lg" text="Loading your Flow address..." />
            ) : (
              <AnimatedButton
                onClick={handleCreateMatch}
                disabled={!selectedNFT || isCreating || !flowAddress}
                variant="primary"
                size="lg"
              >
                {isCreating ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Creating Match...</span>
                  </div>
                ) : (
                  <>🚀 Create Match</>
                )}
              </AnimatedButton>
            )}
            
            {!momentsLoading && !flowAddress && (
              <p style={{ color: '#D1D5DB', marginTop: '1rem', opacity: 0.8 }}>
                Flow address not available. Please refresh the page.
              </p>
            )}
            {!selectedNFT && flowAddress && !momentsLoading && (
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