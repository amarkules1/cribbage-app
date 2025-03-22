import { View, StyleSheet, ScrollView } from 'react-native';
import { Card } from './Card';
import type { Card as CardType } from '@/types/game';

interface HandProps {
  cards: CardType[];
  faceDown?: boolean;
  selectedCards?: CardType[];
  onCardPress?: (card: CardType) => void;
  disabled?: boolean;
}

export function Hand({ cards, faceDown, selectedCards = [], onCardPress, disabled }: HandProps) {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false} 
      contentContainerStyle={styles.container}
      style={styles.scrollView}>
      {cards.map((card, index) => (
        <Card
          key={`${card.suit}-${card.rank}-${index}`}
          card={card}
          faceDown={faceDown}
          selected={selectedCards.some(c => c.rank === card.rank && c.suit === card.suit)}
          onPress={() => onCardPress?.(card)}
          disabled={disabled}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    maxWidth: '100%',
  },
  container: {
    flexDirection: 'row',
    padding: 2,
    alignItems: 'center',
    gap: 1,
  },
});