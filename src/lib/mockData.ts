import { NFT } from '@/types';

export const MOCK_NFTS: (NFT & { contract?: string })[] = [
  {
    id: '1',
    name: 'LeBron James Dunk',
    image: '/testImage.jpg',
    rarity: 'Ultimate',
    collection: 'NBA Top Shot',
    contract: 'A.877931736ee77cff.TopShot'
  },
  {
    id: '2',
    name: 'Stephen Curry 3-Pointer',
    image: '/testImage.jpg',
    rarity: 'Rare',
    collection: 'NBA Top Shot',
    contract: 'A.877931736ee77cff.TopShot'
  },
  {
    id: '3',
    name: 'Giannis Block',
    image: '/testImage.jpg',
    rarity: 'Legendary',
    collection: 'NBA Top Shot',
    contract: 'A.877931736ee77cff.TopShot'
  },
  {
    id: '4',
    name: 'Kobe Fadeaway',
    image: '/testImage.jpg',
    rarity: 'Legendary',
    collection: 'NBA Top Shot',
    contract: 'A.877931736ee77cff.TopShot'
  },
  {
    id: '5',
    name: 'Michael Jordan Dunk',
    image: '/testImage.jpg',
    rarity: 'Ultimate',
    collection: 'NBA Top Shot',
    contract: 'A.877931736ee77cff.TopShot'
  },
  {
    id: '6',
    name: 'Kevin Durant Shot',
    image: '/testImage.jpg',
    rarity: 'Common',
    collection: 'NBA Top Shot',
    contract: 'A.877931736ee77cff.TopShot'
  },
  {
    id: '7',
    name: 'Kawhi Leonard Steal',
    image: '/testImage.jpg',
    rarity: 'Rare',
    collection: 'NBA Top Shot',
    contract: 'A.877931736ee77cff.TopShot'
  },
  {
    id: '8',
    name: 'Luka Doncic Step-back',
    image: '/testImage.jpg',
    rarity: 'Fandom',
    collection: 'NBA Top Shot',
    contract: 'A.877931736ee77cff.TopShot'
  }
];

export function getNFTsByRarity(rarity?: string): NFT[] {
  if (!rarity) return MOCK_NFTS;
  return MOCK_NFTS.filter(nft => nft.rarity?.toLowerCase() === rarity.toLowerCase());
}

export function getNFTById(id: string): NFT | null {
  return MOCK_NFTS.find(nft => nft.id === id) || null;
} 