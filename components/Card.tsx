import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from 'react-native';
import type { Card as CardType } from '@/types/game';

interface CardProps {
  card: CardType;
  faceDown?: boolean;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}

export function Card({ card, faceDown, selected, disabled, onPress }: CardProps) {
  const { suit, rank } = card;
  const isRed = suit === 'hearts' || suit === 'diamonds';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || faceDown}
      style={[
        styles.card,
        selected && styles.selected,
        disabled && styles.disabled,
      ]}>
      <View style={[styles.cardInner, faceDown && styles.cardBack]}>
        {!faceDown && (
          <>
            <Text style={[styles.rank, isRed && styles.redText]}>
              {rank}
            </Text>
            <Text style={[styles.suit, isRed && styles.redText]}>
              {getSuitSymbol(suit)}
            </Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

function getSuitSymbol(suit: CardType['suit']) {
  switch (suit) {
    case 'hearts': return '♥';
    case 'diamonds': return '♦';
    case 'clubs': return '♣';
    case 'spades': return '♠';
  }
}

const styles = StyleSheet.create({
  card: {
    width: 50,
    height: 70,
    margin: 1,
    borderRadius: 6,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardInner: {
    flex: 1,
    padding: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  cardBack: {
    backgroundColor: '#4ade80',
    borderColor: '#fff',
    borderWidth: 2,
  },
  selected: {
    borderWidth: 2,
    borderColor: '#4ade80',
    transform: [{ translateY: -6 }],
  },
  disabled: {
    opacity: 0.5,
  },
  rank: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1a1a1a',
  },
  suit: {
    fontSize: 24,
    textAlign: 'center',
    marginTop: 1,
  },
  redText: {
    color: '#dc2626',
  },
});