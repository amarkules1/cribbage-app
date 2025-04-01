import { Card, Suit, Rank } from '@/types/game';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        suit,
        rank,
        value: getCardValue(rank),
      });
    }
  }
  
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function shuffleNewDeck(): Card[] {
  const deck = createDeck();
  return shuffleDeck(deck);
}

export function getCardValue(rank: Rank): number {
  if (rank === 'A') return 1;
  if (['J', 'Q', 'K'].includes(rank)) return 10;
  return parseInt(rank);
}

export function calculateFifteens(cards: Card[]): number {
  let count = 0;
  
  function findFifteens(remaining: Card[], sum: number, start: number) {
    if (sum === 15) {
      count++;
      return;
    }
    if (sum > 15) return;
    
    for (let i = start; i < remaining.length; i++) {
      findFifteens(remaining, sum + remaining[i].value, i + 1);
    }
  }
  
  findFifteens(cards, 0, 0);
  return count * 2;
}

export function calculatePairs(cards: Card[]): number {
  let pairs = 0;
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      if (cards[i].rank === cards[j].rank) {
        pairs++;
      }
    }
  }
  return pairs * 2;
}

export function calculateRuns(cards: Card[]): number {
  const values = cards.map(card => RANKS.indexOf(card.rank)).sort((a, b) => a - b);
  let maxRun = 0;
  
  for (let i = 0; i < values.length; i++) {
    let currentRun = 1;
    for (let j = i + 1; j < values.length; j++) {
      if (values[j] === values[j - 1] + 1) {
        currentRun++;
      } else {
        break;
      }
    }
    maxRun = Math.max(maxRun, currentRun);
  }
  
  return maxRun >= 3 ? maxRun : 0;
}

export function calculateFlush(cards: Card[]): number {
  const suits = new Set(cards.map(card => card.suit));
  return suits.size === 1 ? cards.length : 0;
}

export function calculateNobs(hand: Card[], starter: Card): number {
  return hand.some(card => card.rank === 'J' && card.suit === starter.suit) ? 1 : 0;
}

export function calculateHandScore(hand: Card[], starter: Card | null): HandScore {
  const allCards = starter ? [...hand, starter] : [...hand];
  
  const score: HandScore = {
    fifteens: calculateFifteens(allCards),
    pairs: calculatePairs(allCards),
    runs: calculateRuns(allCards),
    flushes: calculateFlush(hand) >= 4 ? 4 : 0,
    nobs: starter ? calculateNobs(hand, starter) : 0,
    total: 0,
  };
  
  score.total = score.fifteens + score.pairs + score.runs + score.flushes + score.nobs;
  return score;
}