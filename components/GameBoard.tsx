import { View, StyleSheet, Text, Pressable } from 'react-native';
import { Hand } from './Hand';
import { ScoreBoard } from './ScoreBoard';
import { PeggingArea } from './PeggingArea';
import { useGameStore } from '@/store/gameStore';
import type { Card as CardType } from '@/types/game';
import { useState } from 'react';
import { Scissors } from 'lucide-react-native';

export function GameBoard() {
  const {
    playerHand,
    aiHand,
    originalPlayerHand,
    originalAIHand,
    crib,
    starter,
    phase,
    scores,
    currentPlayer,
    dealer,
    dealerSelection,
    pegging,
    scoringMessage,
    waitingForAcknowledgement,
    playCard,
    drawForDealer,
    discardToCrib,
    cutDeck,
    acknowledgeScore,
    startDealing,
  } = useGameStore();

  const [selectedCards, setSelectedCards] = useState<CardType[]>([]);
  const isPeggingPhase = phase === 'pegging';
  const isCountingPhase = phase === 'counting';

  const handleCardSelect = (card: CardType) => {
    if (phase !== 'discarding') return;

    if (selectedCards.some(c => c.rank === card.rank && c.suit === card.suit)) {
      setSelectedCards(selectedCards.filter(c => c.rank !== card.rank || c.suit !== card.suit));
    } else if (selectedCards.length < 2) {
      setSelectedCards([...selectedCards, card]);
    }
  };

  const handleDiscard = () => {
    if (selectedCards.length === 2) {
      discardToCrib(selectedCards);
      setSelectedCards([]);
    }
  };

  const getDealerMessage = () => {
    if (!dealerSelection.userCard || !dealerSelection.aiCard) {return null;}
    
    if (dealerSelection.needsRedraw) {
      return `Both players drew ${dealerSelection.userCard.rank}s. Draw again!`;
    }

    const userValue = RANKS.indexOf(dealerSelection.userCard.rank);
    const aiValue = RANKS.indexOf(dealerSelection.aiCard.rank);
    const userWonDeal = userValue < aiValue;
    return userWonDeal 
      ? "You drew the lowest card and will deal first!"
      : "AI drew the lowest card and will deal first!";
  };

  if (isCountingPhase && scoringMessage) {
    return (
      <View style={styles.container}>
        <View style={styles.topSection}>
          <Text style={styles.phaseText}>COUNTING</Text>
          <ScoreBoard userScore={scores.user} aiScore={scores.ai} />
          <Hand cards={(dealer != 'user' && scoringMessage.includes('crib')) ? crib : originalAIHand} />
          {starter && (
            <View style={styles.starterContainer}>
              <Text style={styles.label}>Starter</Text>
              <Hand cards={[starter]} disabled />
            </View>
          )}
        </View>

        <View style={styles.middleSection}>
          <View style={styles.message}>
            <Text style={styles.messageText}>{scoringMessage}</Text>
            {waitingForAcknowledgement && (
              <Pressable style={styles.button} onPress={acknowledgeScore}>
                <Text style={styles.buttonText}>OK</Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.bottomSection}>
          <Hand cards={(dealer === 'user' && scoringMessage.includes('crib')) ? crib : originalPlayerHand} disabled />
        </View>
      </View>
    );
  }

  if (phase === 'selecting-dealer') {
    return (
      <View style={styles.container}>
        <View style={styles.dealerSelection}>
          <Text style={styles.phaseText}>SELECTING DEALER</Text>
          
          {!dealerSelection.userCard ? (
            <View style={styles.message}>
              <Text style={styles.messageText}>
                Draw a card to determine the first dealer.{'\n'}
                Low card deals first!
              </Text>
              <Pressable style={styles.button} onPress={drawForDealer}>
                <Text style={styles.buttonText}>Draw Card</Text>
              </Pressable>
            </View>
          ) : (
            <>

            <View style={styles.cardReveal}>
              <Text style={styles.label}>AI drew:</Text>
              <Hand cards={[dealerSelection.aiCard!]} disabled />
            </View>
              <View style={styles.cardReveal}>
                <Text style={styles.label}>You drew:</Text>
                <Hand cards={[dealerSelection.userCard]} disabled />
              </View>

              <View style={styles.resultMessage}>
                <Text style={styles.messageText}>{getDealerMessage()}</Text>
                {dealerSelection.needsRedraw ? (
                  <Pressable style={styles.button} onPress={drawForDealer}>
                    <Text style={styles.buttonText}>Draw Again</Text>
                  </Pressable>
                ) : (
                  <Pressable style={styles.button} onPress={startDealing}>
                    <Text style={styles.buttonText}>Deal Cards</Text>
                  </Pressable>
                )}
              </View>
            </>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <Text style={styles.phaseText}>{phase.toUpperCase()}</Text>
        <ScoreBoard userScore={scores.user} aiScore={scores.ai} />
        <View style={styles.handContainer}>
          <Hand cards={aiHand} faceDown />
          {dealer === 'ai' && crib.length > 0 && (
            <View style={styles.cribContainer}>
              <Text style={styles.label}>Crib</Text>
              <View style={styles.stackedCards}>
                <View style={styles.stackedCard} />
              </View>
            </View>
          )}
        </View>
          {starter && (
            <View style={styles.starterContainer}>
              <Text style={styles.label}>Starter</Text>
              <Hand cards={[starter]} disabled />
            </View>
          )}
      </View>

      <View style={styles.middleSection}>
        {phase === 'discarding' && (
          <View style={styles.message}>
            <Text style={styles.messageText}>
              Select 2 cards to discard to the crib
            </Text>
            <Pressable
              style={[styles.button, selectedCards.length !== 2 && styles.disabledButton]}
              onPress={handleDiscard}
              disabled={selectedCards.length !== 2}>
              <Text style={styles.buttonText}>Confirm Discard</Text>
            </Pressable>
          </View>
        )}

        {phase === 'cutting' && dealer === 'ai' && (
          <View style={styles.message}>
            <Text style={styles.messageText}>
              Cut the deck by pressing the button below
            </Text>
            <Pressable style={styles.button} onPress={cutDeck}>
              <Scissors color="#fff" size={24} style={styles.scissorsIcon} />
              <Text style={styles.buttonText}>Cut Deck</Text>
            </Pressable>
          </View>
        )}

        {phase === 'cutting' && dealer === 'user' && (
          <View style={styles.message}>
            <Text style={styles.messageText}>
              AI is cutting the deck...
            </Text>
          </View>
        )}

        {isPeggingPhase && (
          <PeggingArea
            cards={pegging.cards}
            total={pegging.total}
            currentPlayer={currentPlayer}
          />
        )}
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.handContainer}>
          {dealer === 'user' && crib.length > 0 && (
            <View style={styles.cribContainer}>
              <Text style={styles.label}>Crib</Text>
              <View style={styles.stackedCards}>
                <View style={styles.stackedCard} />
              </View>
            </View>
          )}
          <Hand
            cards={playerHand}
            onCardPress={(card) => {
              if (phase === 'discarding') {
                handleCardSelect(card);
              } else if (isPeggingPhase && currentPlayer === 'user') {
                playCard(card, 'user');
              }
            }}
            selectedCards={phase === 'discarding' ? selectedCards : []}
            disabled={!isPeggingPhase && phase !== 'discarding' || (isPeggingPhase && currentPlayer !== 'user')}
          />
        </View>
      </View>
    </View>
  );
}

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  dealerSelection: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
  },
  cardReveal: {
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    maxWidth: 300,
  },
  message: {
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#1a1a1a',
    padding: 24,
    borderRadius: 12,
    width: '100%',
    maxWidth: 300,
  },
  resultMessage: {
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#4ade80',
    padding: 24,
    borderRadius: 12,
    width: '100%',
    maxWidth: 300,
  },
  messageText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#4ade80',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#4b5563',
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#fff',
  },
  scissorsIcon: {
    transform: [{ rotate: '90deg' }],
  },
  topSection: {
    padding: 16,
  },
  middleSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  bottomSection: {
    padding: 16,
  },
  phaseText: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  starterContainer: {
    alignItems: 'center',
    marginLeft: 'auto',
    marginTop: 16,
  },
  handContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cribContainer: {
    alignItems: 'center',
  },
  stackedCards: {
    position: 'relative',
    width: 50,
    height: 70,
  },
  stackedCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 50,
    height: 70,
    backgroundColor: '#4ade80',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  label: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
});
