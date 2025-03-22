export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number;
}

export type GamePhase = 
  | 'selecting-dealer'
  | 'dealing'
  | 'discarding'
  | 'cutting'
  | 'pegging'
  | 'counting'
  | 'complete';

export type Player = 'user' | 'ai';

export interface DealerSelection {
  userCard: Card | null;
  aiCard: Card | null;
  needsRedraw: boolean;
}

export interface GameState {
  phase: GamePhase;
  deck: Card[];
  playerHand: Card[];
  aiHand: Card[];
  originalPlayerHand: Card[];
  originalAIHand: Card[];
  crib: Card[];
  starter: Card | null;
  currentPlayer: Player;
  dealer: Player | null;
  dealerSelection: DealerSelection;
  scores: {
    user: number;
    ai: number;
  };
  pegging: {
    cards: Card[];
    total: number;
    lastPlayedBy: Player | null;
  };
  isGameOver: boolean;
  winner: Player | null;
  scoringMessage: string | null;
  waitingForAcknowledgement: boolean;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface HandScore {
  fifteens: number;
  pairs: number;
  runs: number;
  flushes: number;
  nobs: number;
  total: number;
}