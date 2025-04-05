import { create } from 'zustand';
import { createDeck, shuffleDeck, shuffleNewDeck, calculateHandScore, getCardValue } from '@/utils/cards';
import { selectAIDiscard, selectAIPegCard } from '@/utils/ai';
import {
  saveGameState,
  loadGameState,
  saveGameStats,
  loadGameStats,
  saveSettings,
  loadSettings,
  GameStats,
  GameSettings,
} from '@/utils/storage';
import type { GameState, Card, Player, GamePhase, Difficulty, HandScore } from '@/types/game';

interface GameStore extends GameState {
  difficulty: Difficulty;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  setDifficulty: (difficulty: Difficulty) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setHapticEnabled: (enabled: boolean) => void;
  startNewGame: () => void;
  loadSavedGame: () => Promise<void>;
  drawForDealer: () => void;
  discardToCrib: (cards: Card[]) => void;
  cutDeck: () => void;
  playCard: (card: Card, player: Player) => void;
  pass: () => void;
  countHand: (player: Player) => HandScore;
  stats: GameStats;
  updateStats: (stats: Partial<GameStats>) => void;
  hasGameInProgress: () => boolean;
  canPlay: (hand: Card[]) => boolean;
  scoreHand: (player: Player) => void;
  scoreCrib: () => void;
  acknowledgeScore: () => void;
  startScoring: () => void;
  startDealing: () => void;
  lastPeggingActionMessage: string | null;
}

const INITIAL_STATE: GameState = {
  phase: 'selecting-dealer',
  deck: [],
  playerHand: [],
  aiHand: [],
  originalPlayerHand: [],
  originalAIHand: [],
  crib: [],
  starter: null,
  currentPlayer: 'user',
  dealer: null,
  lastPeggingActionMessage: null,
  dealerSelection: {
    userCard: null,
    aiCard: null,
    needsRedraw: false,
  },
  scores: {
    user: 0,
    ai: 0,
  },
  pegging: {
    cards: [],
    total: 0,
    lastPlayedBy: null,
  },
  isGameOver: false,
  winner: null,
  scoringMessage: null,
  waitingForAcknowledgement: false,
};

const INITIAL_STATS: GameStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  highestScore: 0,
  perfectHands: 0,
  twentyNineHands: 0,
};

const INITIAL_SETTINGS: GameSettings = {
  difficulty: 'easy',
  soundEnabled: true,
  hapticEnabled: true,
};

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const useGameStore = create<GameStore>((set, get) => ({
  ...INITIAL_STATE,
  ...INITIAL_SETTINGS,
  stats: INITIAL_STATS,

  hasGameInProgress: () => {
    const { phase, isGameOver } = get();
    return phase !== 'selecting-dealer' && !isGameOver;
  },

  canPlay: (hand: Card[]) => {
    const { pegging } = get();
    return hand.some(card => getCardValue(card.rank) + pegging.total <= 31);
  },

  setDifficulty: async (difficulty) => {
    set({ difficulty });
    await saveSettings({ ...get(), difficulty });
  },

  setSoundEnabled: async (soundEnabled) => {
    set({ soundEnabled });
    await saveSettings({ ...get(), soundEnabled });
  },

  setHapticEnabled: async (hapticEnabled) => {
    set({ hapticEnabled });
    await saveSettings({ ...get(), hapticEnabled });
  },

  startNewGame: () => {
    const deck = shuffleDeck(createDeck());
    
    const newState = {
      ...INITIAL_STATE,
      deck,
      phase: 'selecting-dealer' as GamePhase,
    };

    set(newState);
    saveGameState(newState);
  },

  startDealing: () => {
    const { deck } = get();
    const playerHand = deck.slice(0, 6);
    const aiHand = deck.slice(6, 12);
    const remainingDeck = deck.slice(12);

    const newState = {
      ...get(),
      deck: remainingDeck,
      playerHand,
      aiHand,
      phase: 'discarding' as GamePhase,
    };

    set(newState);
    saveGameState(newState);
  },

  drawForDealer: () => {
    const { deck } = get();
    
    const userCard = deck[0];
    const aiCard = deck[1];
    const remainingDeck = deck.slice(2);

    const needsRedraw = userCard.rank === aiCard.rank;
    
    let dealer: Player | null = null;

    if (!needsRedraw) {
      const userValue = RANKS.indexOf(userCard.rank);
      const aiValue = RANKS.indexOf(aiCard.rank);
      dealer = userValue < aiValue ? 'user' : 'ai';
    }

    const newState = {
      ...get(),
      deck: shuffleNewDeck(),
      dealerSelection: {
        userCard,
        aiCard,
        needsRedraw,
      },
      dealer,
    };

    set(newState);
    saveGameState(newState);
  },

  loadSavedGame: async () => {
    const [savedState, savedStats, savedSettings] = await Promise.all([
      loadGameState(),
      loadGameStats(),
      loadSettings(),
    ]);

    if (savedState) {
      set(savedState);
    }

    if (savedStats) {
      set({ stats: savedStats });
    }

    if (savedSettings) {
      set(savedSettings);
    }
  },

  discardToCrib: (cards) => {
    const { playerHand, aiHand, difficulty } = get();
    
    const updatedPlayerHand = playerHand.filter(
      card => !cards.some(c => c.rank === card.rank && c.suit === card.suit)
    );

    const aiDiscard = selectAIDiscard(aiHand, difficulty);
    const updatedAIHand = aiHand.filter(
      card => !aiDiscard.some(c => c.rank === card.rank && c.suit === card.suit)
    );

    const newState = {
      ...get(),
      playerHand: updatedPlayerHand,
      aiHand: updatedAIHand,
      originalPlayerHand: [...updatedPlayerHand],
      originalAIHand: [...updatedAIHand],
      crib: [...cards, ...aiDiscard],
      phase: 'cutting' as GamePhase,
    };

    set(newState);
    saveGameState(newState);

    if (get().dealer === 'user') {
      setTimeout(() => {
        get().cutDeck();
      }, 1000);
    }
  },

  cutDeck: () => {
    const { deck, dealer } = get();
    const cutIndex = Math.floor(Math.random() * deck.length);
    const starter = deck[cutIndex];

    const additionalPoints = starter.rank === 'J' ? 2 : 0;
    const scoringPlayer = dealer;
    
    const newState = {
      ...get(),
      starter,
      phase: 'pegging' as GamePhase,
      scores: {
        ...get().scores,
        [scoringPlayer]: get().scores[scoringPlayer] + additionalPoints,
      },
      currentPlayer: dealer === 'user' ? 'ai' : 'user',
    };

    set(newState);
    saveGameState(newState);

    if (newState.currentPlayer === 'ai') {
      setTimeout(() => {
        const store = get();
        if (store.currentPlayer === 'ai' && store.phase === 'pegging') {
          store.playCard(selectAIPegCard(store.aiHand, store.pegging.cards, store.pegging.total, store.difficulty)!, 'ai');
        }
      }, 1000);
    }
  },

  pass: () => {
    const { currentPlayer, playerHand, aiHand } = get();
    if (currentPlayer !== 'user') return;

    set({ currentPlayer: 'ai' });
    saveGameState({ ...get(), currentPlayer: 'ai' });

    setTimeout(() => {
      const store = get();
      if (store.currentPlayer === 'ai' && store.phase === 'pegging') {
        const aiCard = selectAIPegCard(store.aiHand, store.pegging.cards, store.pegging.total, store.difficulty);
        if (aiCard) {
          store.playCard(aiCard, 'ai');
        } else {
          const lastPlayer = store.pegging.lastPlayedBy;
          if (lastPlayer && store.pegging.total > 0) {
            const newState = {
              ...store,
              pegging: {
                cards: [],
                total: 0,
                lastPlayedBy: null,
              },
              currentPlayer: lastPlayer === 'user' ? 'ai' : 'user',
              lastPeggingActionMessage: lastPlayer === 'user' ? 'You passed' : 'AI passed',
            };
            set(newState);
            saveGameState(newState);
          }
          if (get().currentPlayer === 'ai') {
            const storage = get();
            setTimeout(() => {
              const nextCard = selectAIPegCard(storage.aiHand, storage.pegging.cards, storage.pegging.total, storage.difficulty);
              if (nextCard) {
                storage.playCard(nextCard, 'ai');
              } else {
                const lastPlayer = storage.pegging.lastPlayedBy;
                if (lastPlayer && storage.pegging.total > 0) {
                  const newState = {
                    ...storage,
                    lastPeggingActionMessage: 'AI passed',
                    currentPlayer: lastPlayer === 'user' ? 'ai' : 'user',
                  };
                  set(newState);
                  saveGameState(newState);
                }
              }
            }, 1000);
          }
        }
      }
    }, 1000);
  },

  playCard: (card, player) => {
    const { 
      pegging,
      currentPlayer,
      playerHand,
      aiHand,
      difficulty,
      phase,
      originalPlayerHand,
      originalAIHand
    } = get();

    let pointsToAward = 0;
    let pointsReason = '';

    // check if we're in pegging phase
    if (phase !== 'pegging') return;
    // check if the card can be played
    if (!get().canPlay([card])) return;
    // add card to count
    let peggingTotal = pegging.total + getCardValue(card.rank);
    let newPeggingCards = [...pegging.cards, card];
    // remove card from player hand
    const newPlayerHand = playerHand.filter(c => c.rank !== card.rank || c.suit !== card.suit);
    const newAIHand = aiHand.filter(c => c.rank !== card.rank || c.suit !== card.suit);
    const newCurrentPlayer = player === 'user' ? 'ai' : 'user';
    // update state 
    const newState1 = {
      ...get(),
      playerHand: newPlayerHand,
      aiHand: newAIHand,
      currentPlayer: newCurrentPlayer,
      pegging: {
        ...get().pegging,
        lastPlayedBy: player,
        cards: newPeggingCards,
        total: peggingTotal,
      },
    };
    set(newState1);
    saveGameState(newState1);
    // determine if any points should be awarded
    if (peggingTotal === 31) {
      pointsToAward = 2;
      pointsReason = '31 for 2';
    } else if (peggingTotal === 15) {
      pointsToAward = 2;
      pointsReason = '15 for 2';
    } else if (!get().canPlay(playerHand) && !get().canPlay(aiHand)) {
      pointsToAward = 1;
      pointsReason = (playerHand.length === 0 && aiHand.length === 0) ? 'Last card for 1' : 'Go for 1';
    }
    const pointsForRun = getPeggingPointsForRun(newPeggingCards);
    if (pointsForRun > 0) {
      pointsToAward += pointsForRun;
      pointsReason = pointsReason ? pointsReason + ', Run of ' + pointsForRun : 'Run of ' + pointsForRun;
    }
    const pointsForPair = getPeggingPointsForPair(newPeggingCards);
    if (pointsForPair > 0) {
      pointsToAward += pointsForPair;
      if (pointsForPair === 2) {
        pointsReason = pointsReason ? pointsReason + ', Pair for 2' : 'Pair for 2';
      } else if (pointsForPair === 6) {
        pointsReason = pointsReason ? pointsReason + ', Three of a Kind for 6' : 'Three of a Kind for 6';
      } else if (pointsForPair === 12) {
        pointsReason = pointsReason ? pointsReason + ', Four of a Kind for 12' : 'Four of a Kind for 12';
      }
    }
    // update points and turn
    const newState = {
      ...get(),
      playerHand: newPlayerHand,
      aiHand: newAIHand,
      currentPlayer: newCurrentPlayer,
      scores: {
        ...get().scores,
        [player]: get().scores[player] + pointsToAward,
      },
      lastPeggingActionMessage: pointsReason,

    };
    set(newState);
    saveGameState(newState);

    if (newPlayerHand.length === 0 && newAIHand.length === 0) {
      
      const newState = {
        ...get(),
        phase: 'counting' as GamePhase,
      };
      setTimeout(() => {
        set(newState);
        saveGameState(newState);
        get().startScoring();
      }, 2000);
      return;
    }

    // if it's now the AI's turn, play a card
    if (newCurrentPlayer === 'ai') {
      const storage = get();
      setTimeout(() => {
        const nextCard = selectAIPegCard(aiHand, pegging.cards, pegging.total, difficulty);
        if (nextCard && storage.canPlay([nextCard])) {
          storage.playCard(nextCard, 'ai');
        } else {
          const lastPlayer = storage.pegging.lastPlayedBy;
          if (lastPlayer && storage.pegging.total > 0) {
            const newState = {
              ...storage,
              lastPeggingActionMessage: 'AI passed',
              currentPlayer: 'user',
              pegging: {
                ...storage.pegging,
              },
            };
            set(newState);
            saveGameState(newState);
          }
        }
      }, 1000);
    }
  },

  startScoring: () => {
    const { dealer } = get();
    const firstPlayer = dealer === 'user' ? 'ai' : 'user';
    get().scoreHand(firstPlayer);
  },

  scoreHand: (player) => {
    const { originalPlayerHand, originalAIHand, starter, dealer } = get();
    const hand = player === 'user' ? originalPlayerHand : originalAIHand;
    const score = calculateHandScore(hand, starter);
    
    const message = `${player === 'user' ? 'Your' : "AI's"} hand scores ${score.total} points`;
    
    const newState = {
      ...get(),
      scores: {
        ...get().scores,
        [player]: get().scores[player] + score.total,
      },
      scoringMessage: message,
      waitingForAcknowledgement: true,
    };

    set(newState);
    saveGameState(newState);
  },

  acknowledgeScore: () => {
    const { dealer, phase, scoringMessage } = get();

    if (phase === 'counting') {
      // If no message is shown yet, start with non-dealer's hand
      if (!scoringMessage) {
        const firstPlayer = dealer === 'user' ? 'ai' : 'user';
        get().scoreHand(firstPlayer);
        return;
      }

      const currentState = get();
      
      // If we're showing a hand score (not crib)
      if (!currentState.scoringMessage?.toLowerCase().includes('crib')) {
        // If we just showed the first hand
        if (currentState.scoringMessage?.toLowerCase().includes(dealer === 'user' ? 'ai' : 'your')) {
          // Clear message and score dealer's hand
          set({ 
            ...currentState,
            scoringMessage: null,
            waitingForAcknowledgement: false 
          });
          
          // Score the second hand (dealer's hand)
          setTimeout(() => {
            get().scoreHand(dealer);
          }, 100);
        } else {
          // We just showed the dealer's hand, move to crib
          set({ 
            ...currentState,
            scoringMessage: null,
            waitingForAcknowledgement: false 
          });
          
          // Score the crib
          setTimeout(() => {
            get().scoreCrib();
          }, 100);
        }
      } else {
        // After crib is scored, start next round
        const newDealer = dealer === 'user' ? 'ai' : 'user';
        const deck = shuffleDeck(createDeck());
        const playerHand = deck.slice(0, 6);
        const aiHand = deck.slice(6, 12);
        const remainingDeck = deck.slice(12);

        const newState = {
          ...currentState,
          phase: 'discarding' as GamePhase,
          deck: remainingDeck,
          playerHand,
          aiHand,
          crib: [],
          starter: null,
          dealer: newDealer,
          currentPlayer: newDealer === 'user' ? 'ai' : 'user',
          scoringMessage: null,
          waitingForAcknowledgement: false,
          pegging: {
            cards: [],
            total: 0,
            lastPlayedBy: null,
          },
        };

        set(newState);
        saveGameState(newState);
      }
    }
  },

  scoreCrib: () => {
    const { crib, starter, dealer } = get();
    const score = calculateHandScore(crib, starter);
    
    const message = `${dealer === 'user' ? 'Your' : "AI's"} crib scores ${score.total} points`;
    
    const newState = {
      ...get(),
      scores: {
        ...get().scores,
        [dealer]: get().scores[dealer] + score.total,
      },
      scoringMessage: message,
      waitingForAcknowledgement: true,
    };

    set(newState);
    saveGameState(newState);
  },

  countHand: (player) => {
    const { originalPlayerHand, originalAIHand, starter } = get();
    const hand = player === 'user' ? originalPlayerHand : originalAIHand;
    return calculateHandScore(hand, starter);
  },

  updateStats: async (newStats) => {
    const updatedStats = {
      ...get().stats,
      ...newStats,
    };
    set({ stats: updatedStats });
    await saveGameStats(updatedStats);
  },
}));

function calculatePeggingPoints(cards: Card[]): number {
  let points = 0;
  
  // Points for 15 or 31
  const total = cards.reduce((sum, card) => sum + getCardValue(card.rank), 0);
  if (total === 15 || total === 31) points += 2;
  
  // Points for pairs
  if (cards.length >= 2) {
    const last = cards[cards.length - 1];
    const secondLast = cards[cards.length - 2];
    if (last.rank === secondLast.rank) points += 2;
  }
  
  // Check for runs (looking at the last 7 cards down to 3)
  for (let length = Math.min(7, cards.length); length >= 3; length--) {
    const lastCards = cards.slice(-length);
    if (lastCards.length === length) {
      const ranks = lastCards
        .map(card => RANKS.indexOf(card.rank))
        .sort((a, b) => a - b);
      
      if (isConsecutive(ranks)) {
        points += length;
        break; // Only count the longest run
      }
    }
  }
  
  return points;
}

function isConsecutive(numbers: number[]): boolean {
  for (let i = 1; i < numbers.length; i++) {
    if (numbers[i] !== numbers[i - 1] + 1) return false;
  }
  return true;
}

function getPeggingPointsForRun(cards: Card[]): number {
  for (let i = cards.length; i > 2; i--) {
    const lastCards = cards.slice(-i);
    const ranks = lastCards.map(card => RANKS.indexOf(card.rank)).sort((a, b) => a - b);
    if (isConsecutive(ranks)) {
      return i;
    }
  }
  return 0;
}

function getPeggingPointsForPair(cards: Card[]): number {
  let lastRank = cards[cards.length - 1].rank;
  if (cards.length > 1 && cards[cards.length - 2].rank === lastRank) {
    if (cards.length > 2 && cards[cards.length - 3].rank === lastRank) {
      if (cards.length > 3 && cards[cards.length - 4].rank === lastRank) {
        return 12;
      }
      return 6;
    }
    return 2;
  }
  return 0;
}
