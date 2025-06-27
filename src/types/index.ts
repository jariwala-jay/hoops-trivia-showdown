export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  timeLimit: number; // in seconds
}

export interface Player {
  id: string;
  name: string;
  avatar?: string;
  flowAddress?: string;
}

export interface NFT {
  id: string;
  name: string;
  image: string;
  rarity?: string;
  collection?: string;
  // Additional fields for transfer operations
  contract?: string;
  dappID?: string;
  serialNumber?: number;
}

export interface PlayerAnswer {
  questionId: string;
  selectedOption: number;
  timeRemaining: number;
  isCorrect: boolean;
  points: number;
}

export interface Match {
  id: string;
  status: 'PENDING' | 'READY' | 'IN_PROGRESS' | 'FINISHED';
  playerA: Player;
  playerB?: Player;
  nftA: NFT;
  nftB?: NFT;
  questions: Question[];
  answersA: PlayerAnswer[];
  answersB: PlayerAnswer[];
  scoreA: number;
  scoreB: number;
  winner?: 'A' | 'B' | 'TIE';
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  currentQuestionIndex: number;
  // NFT Transfer tracking
  nftTransferStatus?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  nftTransferError?: string;
  nftTransferAttempts?: number;
}

export interface GameState {
  match: Match | null;
  currentPlayer: 'A' | 'B' | null;
  isLoading: boolean;
  error: string | null;
}

// Auth0 User Interface
export interface User {
  sub: string;
  nickname: string;
  name: string;
  picture: string;
  email: string;
}

// GraphQL Response Types
export interface FlowAccount {
  address: string;
  balance: number;
  isInitialized?: boolean;
}

export interface TokenResponse {
  id: string;
  name: string;
  image: string;
  rarity: string;
  collection: {
    name: string;
  };
}

// NFT Transfer Types
export interface WithdrawNftInput {
  contractQualifiedName?: string;
  dappID: string;
  destinationAddress: string;
  tokenID: number;
}

export interface NftWithdrawal {
  id: string;
  tokenID: number;
  dappID: string;
  contractQualifiedName?: string;
  destinationAddress: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  completedAt?: string;
  transactionHash?: string;
}

export interface WithdrawNftResponse {
  id: string;
  withdrawal: NftWithdrawal;
}

// Transfer operation tracking
export interface NFTTransferOperation {
  id: string;
  matchId: string;
  fromPlayer: 'A' | 'B';
  toPlayer: 'A' | 'B';
  nftId: string;
  nftTokenId: number;
  fromAddress: string;
  toAddress: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  attempts: number;
  maxAttempts: number;
  error?: string;
  withdrawalId?: string;
  transactionHash?: string;
  createdAt: string;
  updatedAt: string;
} 