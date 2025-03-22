import { Card, HandScore, Difficulty } from '@/types/game';
import { calculateHandScore, getCardValue } from './cards';

export function selectAIDiscard(hand: Card[], difficulty: Difficulty): Card[] {
  const combinations = getCombinations(hand, 2);
  let bestScore = -1;
  let bestDiscard: Card[] = combinations[0];

  combinations.forEach(discard => {
    const keptCards = hand.filter(
      card => !discard.some(d => d.rank === card.rank && d.suit === card.suit)
    );

    const score = evaluateHand(keptCards, difficulty);
    if (score > bestScore) {
      bestScore = score;
      bestDiscard = discard;
    }
  });

  return bestDiscard;
}

export function selectAIPegCard(
  hand: Card[],
  peggingCards: Card[],
  total: number,
  difficulty: Difficulty
): Card | null {
  const playableCards = hand.filter(card => getCardValue(card.rank) + total <= 31);
  
  if (playableCards.length === 0) return null;

  switch (difficulty) {
    case 'hard':
      return selectBestPegCard(playableCards, peggingCards, total);
    case 'medium':
      return selectMediumPegCard(playableCards, peggingCards, total);
    case 'easy':
    default:
      return selectEasyPegCard(playableCards);
  }
}

function selectBestPegCard(
  playableCards: Card[],
  peggingCards: Card[],
  total: number
): Card {
  let bestCard = playableCards[0];
  let bestScore = -1;

  playableCards.forEach(card => {
    let score = 0;
    const newTotal = total + getCardValue(card.rank);

    // Score for making 15 or 31
    if (newTotal === 15 || newTotal === 31) score += 2;

    // Score for pairs
    if (peggingCards.length > 0) {
      const lastCard = peggingCards[peggingCards.length - 1];
      if (card.rank === lastCard.rank) score += 2;
    }

    // Score for runs
    const potentialRun = [...peggingCards.slice(-2), card]
      .map(c => RANKS.indexOf(c.rank))
      .sort((a, b) => a - b);
    if (isConsecutive(potentialRun)) score += potentialRun.length;

    // Avoid leaving easy scoring opportunities
    const remainingSpace = 31 - newTotal;
    if (remainingSpace === 15) score -= 1;

    if (score > bestScore) {
      bestScore = score;
      bestCard = card;
    }
  });

  return bestCard;
}

function selectMediumPegCard(
  playableCards: Card[],
  peggingCards: Card[],
  total: number
): Card {
  // 70% chance to play optimally, 30% chance to play randomly
  if (Math.random() < 0.7) {
    return selectBestPegCard(playableCards, peggingCards, total);
  }
  return selectEasyPegCard(playableCards);
}

function selectEasyPegCard(playableCards: Card[]): Card {
  // Randomly select a playable card
  return playableCards[Math.floor(Math.random() * playableCards.length)];
}

// Helper functions
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function getCombinations<T>(array: T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (array.length === 0) return [];

  const [first, ...rest] = array;
  const combsWithoutFirst = getCombinations(rest, size);
  const combsWithFirst = getCombinations(rest, size - 1).map(comb => [first, ...comb]);

  return [...combsWithoutFirst, ...combsWithFirst];
}

function evaluateHand(cards: Card[], difficulty: Difficulty): number {
  let score = 0;

  // Calculate base score
  const handScore = calculateHandScore(cards, null);
  score += handScore.total;

  // Add strategic scoring based on difficulty
  if (difficulty === 'hard') {
    // Prefer keeping high cards for pegging
    score += cards.reduce((sum, card) => sum + getCardValue(card.rank), 0) * 0.1;
    
    // Prefer keeping cards that could make runs
    const ranks = cards.map(card => RANKS.indexOf(card.rank)).sort((a, b) => a - b);
    if (isConsecutive(ranks)) score += ranks.length;
    
    // Prefer keeping same suits for flush potential
    const suits = new Set(cards.map(card => card.suit));
    if (suits.size === 1) score += 2;
  }

  return score;
}

function isConsecutive(numbers: number[]): boolean {
  for (let i = 1; i < numbers.length; i++) {
    if (numbers[i] !== numbers[i - 1] + 1) return false;
  }
  return true;
}