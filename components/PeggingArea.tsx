import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Hand } from './Hand';
import type { Card } from '@/types/game';
import { useGameStore } from '@/store/gameStore';

interface PeggingAreaProps {
  cards: Card[];
  total: number;
  currentPlayer: 'user' | 'ai';
}

export function PeggingArea({ cards, total, currentPlayer }: PeggingAreaProps) {
  const { playerHand, canPlay, pass } = useGameStore();
  const showPassButton = currentPlayer === 'user' && !canPlay(playerHand);

  return (
    <View style={styles.container}>
      <View style={styles.countContainer}>
        <Text style={styles.label}>Count</Text>
        <Text style={styles.count}>{total}</Text>
      </View>
      
      <View style={styles.playedCards}>
        <Text style={styles.label}>Played Cards</Text>
        <Hand cards={cards} disabled />
      </View>

      {showPassButton ? (
        <Pressable style={styles.passButton} onPress={pass}>
          <Text style={styles.passButtonText}>Pass</Text>
        </Pressable>
      ) : (
        <Text style={[styles.turnIndicator, currentPlayer === 'ai' && styles.aiTurn]}>
          {currentPlayer === 'user' ? 'Your turn' : 'AI thinking...'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    maxWidth: 300,
  },
  countContainer: {
    alignItems: 'center',
  },
  count: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    color: '#4ade80',
  },
  playedCards: {
    alignItems: 'center',
    width: '100%',
  },
  label: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  turnIndicator: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#4ade80',
  },
  aiTurn: {
    color: '#2563eb',
  },
  passButton: {
    backgroundColor: '#4b5563',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  passButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#fff',
  },
});