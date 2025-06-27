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