import { View, Text, StyleSheet } from 'react-native';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';

export default function StatsScreen() {
  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Bold': Inter_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Statistics</Text>

      <View style={styles.statsContainer}>
        <StatItem title="Games Played" value="0" />
        <StatItem title="Games Won" value="0" />
        <StatItem title="Win Rate" value="0%" />
        <StatItem title="Highest Score" value="0" />
        <StatItem title="Perfect Hands" value="0" />
        <StatItem title="29-Point Hands" value="0" />
      </View>
    </View>
  );
}

function StatItem({ title, value }: { title: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    color: '#fff',
    marginTop: 60,
    marginBottom: 30,
  },
  statsContainer: {
    gap: 16,
  },
  statItem: {
    backgroundColor: '#333',
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statTitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#fff',
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#4ade80',
  },
});