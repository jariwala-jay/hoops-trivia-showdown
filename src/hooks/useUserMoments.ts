import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0';
import { NFT } from '@/types';

// Helper function to extract rarity from description
function extractRarity(description: string): 'Common' | 'Rare' | 'Epic' | 'Legendary' {
  const lowerDesc = description.toLowerCase();
  if (lowerDesc.includes('legendary')) return 'Legendary';
  if (lowerDesc.includes('epic')) return 'Epic';
  if (lowerDesc.includes('rare')) return 'Rare';
  return 'Common';
}

interface UseUserMomentsReturn {
  moments: NFT[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  flowAddress: string | null;
}

export function useUserMoments(): UseUserMomentsReturn {
  const { user, isLoading: userLoading } = useUser();
  const [moments, setMoments] = useState<NFT[]>([]);
  const [flowAddress, setFlowAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async () => {
    if (!user || userLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch both NFTs and Flow address in parallel
      const [tokensResponse, flowResponse] = await Promise.all([
        fetch('/api/user-tokens'),
        fetch('/api/user-flow-account')
      ]);

      // Handle NFTs
      if (tokensResponse.ok) {
        const tokensData = await tokensResponse.json();
        console.log('Tokens response:', tokensData);
        
        // Handle both direct tokens array and GraphQL response format
        const tokens = tokensData.tokens || tokensData.data?.getTokens?.tokens || [];
        
        // Convert tokens to NFT format, filtering out those in withdrawal progress
        const nfts: NFT[] = tokens
          .filter((token: { isWithdrawInProgress?: boolean }) => !token.isWithdrawInProgress)
          .map((token: {
            id: string;
            title?: string;
            imageURL?: string;
            description?: string;
            serialNumber?: number;
            contract?: string;
            dapp?: { name?: string; id?: string };
            isWithdrawInProgress?: boolean;
          }) => ({
            id: token.id,
            name: token.title || `Token #${token.id}`,
            image: token.imageURL || '/testImage.jpg',
            rarity: extractRarity(token.description || ''),
            collection: token.dapp?.name || 'NBA Top Shot',
            contract: token.contract || 'A.877931736ee77cff.TopShot',
            dappID: token.dapp?.id || 'ad3260ba-a87c-4359-a8b0-def2cc36310b',
            serialNumber: token.serialNumber,
            isWithdrawInProgress: token.isWithdrawInProgress || false
          }));
        
        setMoments(nfts);
        console.log('Processed NFTs:', nfts);
      } else {
        console.error('Failed to fetch tokens:', tokensResponse.status);
        setMoments([]);
      }

      // Handle Flow address
      if (flowResponse.ok) {
        const flowData = await flowResponse.json();
        console.log('Flow address API response:', flowData);
        setFlowAddress(flowData.address || null);
        console.log('User Flow address set to:', flowData.address);
      } else {
        const errorText = await flowResponse.text();
        console.error('Failed to fetch Flow address:', flowResponse.status, errorText);
        setFlowAddress(null);
      }

    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user data');
      setMoments([]);
      setFlowAddress(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    
    // Set up auto-refresh every 30 seconds to check withdrawal status
    const interval = setInterval(() => {
      if (user && !userLoading) {
        fetchUserData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user, userLoading]);

  return {
    moments,
    flowAddress,
    isLoading,
    error,
    refetch: fetchUserData
  };
} 