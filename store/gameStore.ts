import { create } from 'zustand';
import { createDeck, shuffleDeck, calculateHandScore, getCardValue } from '@/utils/cards';
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
  playCard: (card: Card) => void;
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
    let nextPhase: GamePhase = 'selecting-dealer';

    if (!needsRedraw) {
      const userValue = RANKS.indexOf(userCard.rank);
      const aiValue = RANKS.indexOf(aiCard.rank);
      dealer = userValue < aiValue ? 'user' : 'ai';
      nextPhase = 'dealing';
    }

    const newState = {
      ...get(),
      deck: needsRedraw ? shuffleDeck(deck) : remainingDeck,
      dealerSelection: {
        userCard,
        aiCard,
        needsRedraw,
      },
      dealer,
      phase: nextPhase,
    };

    set(newState);
    saveGameState(newState);

    if (!needsRedraw) {
      setTimeout(() => {
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
      }, 2000);
    }
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
          store.playCard(selectAIPegCard(store.aiHand, store.pegging.cards, store.pegging.total, store.difficulty)!);
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
          store.playCard(aiCard);
        } else {
          const lastPlayer = store.pegging.lastPlayedBy;
          if (lastPlayer && store.pegging.total > 0) {
            const points = store.pegging.total === 31 ? 2 : 1;
            const message = `${lastPlayer === 'user' ? 'You' : 'AI'} scored ${points} ${points === 1 ? 'point' : 'points'} for last card`;
            
            const newState = {
              ...store,
              scores: {
                ...store.scores,
                [lastPlayer]: store.scores[lastPlayer] + points,
              },
              scoringMessage: message,
              waitingForAcknowledgement: true,
            };
            set(newState);
            saveGameState(newState);
          } else {
            // Neither player can play - reset the count
            const newState = {
              ...store,
              pegging: {
                cards: [],
                total: 0,
                lastPlayedBy: null,
              },
              currentPlayer: 'user',
            };
            
            // If both hands are empty, move to counting phase
            if (store.playerHand.length === 0 && store.aiHand.length === 0) {
              newState.phase = 'counting';
            }
            
            set(newState);
            saveGameState(newState);
            
            if (newState.phase === 'counting') {
              setTimeout(() => get().startScoring(), 1000);
            }
          }
        }
      }
    }, 1000);
  },

  playCard: (card) => {
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

    if (phase !== 'pegging') return;

    const canPlay = (hand: Card[]): boolean => {
      return hand.some(card => getCardValue(card.rank) + pegging.total <= 31);
    };

    const awardLastPlayerPoints = () => {
      const lastPlayer = pegging.lastPlayedBy;
      if (lastPlayer && pegging.total > 0) {
        const points = pegging.total === 31 ? 2 : 1;
        const message = `${lastPlayer === 'user' ? 'You' : 'AI'} scored ${points} ${points === 1 ? 'point' : 'points'} for last card`;
        
        const newState = {
          ...get(),
          scores: {
            ...get().scores,
            [lastPlayer]: get().scores[lastPlayer] + points,
          },
          scoringMessage: message,
          waitingForAcknowledgement: true,
        };
        set(newState);
        saveGameState(newState);
      }
    };

    if (currentPlayer === 'user') {
      const newTotal = getCardValue(card.rank) + pegging.total;
      if (newTotal > 31) return;

      const updatedPegging = {
        cards: [...pegging.cards, card],
        total: newTotal,
        lastPlayedBy: currentPlayer,
      };

      const updatedPlayerHand = playerHand.filter(
        c => c.rank !== card.rank || c.suit !== card.suit
      );

      const newState = {
        ...get(),
        playerHand: updatedPlayerHand,
        pegging: updatedPegging,
        currentPlayer: 'ai',
        originalPlayerHand,
        originalAIHand,
      };

      set(newState);
      saveGameState(newState);

      const points = calculatePeggingPoints(updatedPegging.cards);
      if (points > 0) {
        const stateWithPoints = {
          ...newState,
          scores: {
            ...newState.scores,
            user: newState.scores.user + points,
          },
        };
        set(stateWithPoints);
        saveGameState(stateWithPoints);

        if (updatedPlayerHand.length === 0 && aiHand.length === 0) {
          awardLastPlayerPoints();
          const finalState = {
            ...stateWithPoints,
            phase: 'counting' as GamePhase,
          };
          set(finalState);
          saveGameState(finalState);
          return;
        }
      } else {
        if (updatedPlayerHand.length === 0 && aiHand.length === 0) {
          awardLastPlayerPoints();
          const finalState = {
            ...newState,
            phase: 'counting' as GamePhase,
          };
          set(finalState);
          saveGameState(finalState);
          return;
        }
      }

      setTimeout(() => {
        const store = get();
        if (store.currentPlayer === 'ai' && store.phase === 'pegging') {
          const aiCard = selectAIPegCard(store.aiHand, store.pegging.cards, store.pegging.total, store.difficulty);
          if (aiCard) {
            store.playCard(aiCard);
          } else {
            if (!canPlay(store.playerHand)) {
              awardLastPlayerPoints();
            }
            set({ ...store, currentPlayer: 'user' });
            saveGameState({ ...store, currentPlayer: 'user' });
          }
        }
      }, 1000);

    } else {
      const newTotal = getCardValue(card.rank) + pegging.total;
      if (newTotal > 31) return;

      const updatedPegging = {
        cards: [...pegging.cards, card],
        total: newTotal,
        lastPlayedBy: currentPlayer,
      };

      const updatedAIHand = aiHand.filter(
        c => c.rank !== card.rank || c.suit !== card.suit
      );

      const newState = {
        ...get(),
        aiHand: updatedAIHand,
        pegging: updatedPegging,
        currentPlayer: 'user',
        originalPlayerHand,
        originalAIHand,
      };

      set(newState);
      saveGameState(newState);

      const points = calculatePeggingPoints(updatedPegging.cards);
      if (points > 0) {
        const stateWithPoints = {
          ...newState,
          scores: {
            ...newState.scores,
            ai: newState.scores.ai + points,
          },
        };
        set(stateWithPoints);
        saveGameState(stateWithPoints);

        if (updatedAIHand.length === 0 && playerHand.length === 0) {
          awardLastPlayerPoints();
          const finalState = {
            ...stateWithPoints,
            phase: 'counting' as GamePhase,
          };
          set(finalState);
          saveGameState(finalState);
          return;
        }
      } else {
        if (updatedAIHand.length === 0 && playerHand.length === 0) {
          awardLastPlayerPoints();
          const finalState = {
            ...newState,
            phase: 'counting' as GamePhase,
          };
          set(finalState);
          saveGameState(finalState);
          return;
        }
      }

      if (!canPlay(playerHand)) {
        const aiCanPlay = canPlay(updatedAIHand);
        if (!aiCanPlay) {
          awardLastPlayerPoints();
        } else {
          set({ ...newState, currentPlayer: 'ai' });
          saveGameState({ ...newState, currentPlayer: 'ai' });
          
          setTimeout(() => {
            const store = get();
            if (store.currentPlayer === 'ai' && store.phase === 'pegging') {
              const nextCard = selectAIPegCard(store.aiHand, store.pegging.cards, store.pegging.total, store.difficulty);
              if (nextCard) {
                store.playCard(nextCard);
              }
            }
          }, 1000);
        }
      }
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
    const { dealer, phase, scoringMessage, pegging } = get();

    if (phase === 'pegging') {
      const newState = {
        ...get(),
        scoringMessage: null,
        waitingForAcknowledgement: false,
        pegging: {
          cards: [],
          total: 0,
          lastPlayedBy: null,
        },
      };

      // If both hands are empty after acknowledging the last card, move to counting
      const { playerHand, aiHand } = get();
      if (playerHand.length === 0 && aiHand.length === 0) {
        newState.phase = 'counting';
        set(newState);
        saveGameState(newState);
        setTimeout(() => get().startScoring(), 1000);
      } else {
        set(newState);
        saveGameState(newState);
      }
      return;
    }

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

export { useGameStore }