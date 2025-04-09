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
  let combos = enumerateCardCombinations(cards);
  return combos.filter(combo => combo.reduce((acc, card) => acc + card.value, 0) === 15).length * 2;
}

export function enumerateCardCombinations(cards: Card[]): Card[][] {
  const combinations: Card[][] = [];
  cards = cards.sort((a, b) => RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank));
  for (let i = 0; i < cards.length; i++){
    if (combinations.length === 0) {
      combinations.push([]);
      combinations.push([cards[i]]);
    } else {
      const currLen = combinations.length;
      for (let j = 0; j < currLen; j++) {
        combinations.push([...combinations[j], cards[i]]);
      }
    }
  }

  return combinations;
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
  let combos = enumerateCardCombinations(cards);
  let runsOfFive = 0;
  let runsOfFour = 0;
  let runsOfThree = 0;
  for (let combo of combos) {
    if (isConsecutive(combo.map(card => RANKS.indexOf(card.rank)))) {
      if (combo.length === 5) runsOfFive++;
      if (combo.length === 4) runsOfFour++;
      if (combo.length === 3) runsOfThree++;
    }
  }
  if (runsOfFive > 0) return runsOfFive * 5;
  if (runsOfFour > 0) return runsOfFour * 4;
  if (runsOfThree > 0) return runsOfThree * 3;
  return 0;
}

export function calculateFlush(cards: Card[], starter: Card | null): number {
  let suit = cards[0].suit;
  for (let card of cards) {
    if (card.suit !== suit) return 0;
  }
  if (starter && starter.suit == suit) return 5;
  return 4;
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
    flushes: calculateFlush(hand, starter) >= 4 ? 4 : 0,
    nobs: starter ? calculateNobs(hand, starter) : 0,
    total: 0,
  };
  
  score.total = score.fifteens + score.pairs + score.runs + score.flushes + score.nobs;
  return score;
}

export function isConsecutive(numbers: number[]): boolean {
  for (let i = 1; i < numbers.length; i++) {
    if (numbers[i] !== numbers[i - 1] + 1) return false;
  }
  return true;
}