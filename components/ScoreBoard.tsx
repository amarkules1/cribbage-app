import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native';
import { Trophy } from 'lucide-react-native';
import { useGameStore } from '@/store/gameStore';

interface ScoreBoardProps {
  userScore: number;
  aiScore: number;
}

export function ScoreBoard({ userScore, aiScore }: ScoreBoardProps) {
  const dealer = useGameStore((state) => state.dealer);

  return (
    <View style={styles.container}>
      <View style={styles.scoreContainer}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>You</Text>
          {dealer === 'user' && (
            <Text style={styles.dealerText}>(Dealer)</Text>
          )}
        </View>
        <Text style={styles.score}>{userScore}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.scoreContainer}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>AI</Text>
          {dealer === 'ai' && (
            <Text style={styles.dealerText}>(Dealer)</Text>
          )}
        </View>
        <Text style={styles.score}>{aiScore}</Text>
      </View>
      {(userScore >= 121 || aiScore >= 121) && (
        <Trophy color="#4ade80" size={24} style={styles.trophy} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    margin: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreContainer: {
    flex: 1,
    alignItems: 'center',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  dealerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#4ade80',
    marginBottom: 4,
  },
  score: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    color: '#4ade80',
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: '#333',
    marginHorizontal: 16,
  },
  trophy: {
    position: 'absolute',
    top: -12,
    right: -12,
  },
});