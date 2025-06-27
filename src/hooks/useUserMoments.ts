import { useState, useEffect } from 'react';

interface UserMoment {
  id: string;
  name: string;
  description: string;
  image: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Fandom';
  player?: string;
  team?: string;
  serialNumber?: number;
  collection?: string;
  dapp?: string;
}

interface UseUserMomentsResult {
  moments: UserMoment[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useUserMoments(): UseUserMomentsResult {
  const [moments, setMoments] = useState<UserMoment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMoments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching user tokens...');

      // Use our server-side API that handles Dapper authentication
      const response = await fetch('/api/user-tokens');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tokens');
      }

      console.log('Tokens response:', data);

      const processedMoments: UserMoment[] = [];

      if (data.data?.getTokens?.tokens) {
        data.data.getTokens.tokens.forEach((token: {
          id: string;
          title: string;
          description: string;
          imageURL?: string;
          serialNumber?: number;
          contract?: string;
          dapp?: {
            name?: string;
            tokenFallbackImageURL?: string;
          };
        }) => {
          // Filter out packs - only include NBA Top Shot moments
          if (token.contract === 'A.877931736ee77cff.TopShot') {
            // Extract rarity from description
            const extractRarity = (desc: string): 'Common' | 'Rare' | 'Epic' | 'Legendary' => {
              const lowerDesc = desc.toLowerCase();
              if (lowerDesc.includes('legendary')) return 'Legendary';
              if (lowerDesc.includes('epic')) return 'Epic';
              if (lowerDesc.includes('rare')) return 'Rare';
              if (lowerDesc.includes('fandom')) return 'Common'; // Fandom is typically common tier
              return 'Common'; // Default
            };

            processedMoments.push({
              id: token.id,
              name: token.title || `Token #${token.id}`,
              description: token.description || '',
              image: token.imageURL || token.dapp?.tokenFallbackImageURL || '/testImage.jpg',
              rarity: extractRarity(token.description || ''),
              collection: token.dapp?.name || 'NBA Top Shot',
              dapp: token.dapp?.name || 'NBA Top Shot',
              serialNumber: token.serialNumber
            });
          }
        });
      }

      console.log('Processed moments:', processedMoments);

      setMoments(processedMoments);
      setLoading(false);

    } catch (err) {
      console.error('Error fetching moments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch moments');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMoments();
  }, []);

  return {
    moments,
    loading,
    error,
    refetch: fetchMoments
  };
} 