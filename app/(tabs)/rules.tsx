import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';

export default function RulesScreen() {
  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Bold': Inter_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>How to Play Cribbage</Text>
      
      <Section title="Objective">
        <Text style={styles.text}>
          Be the first player to reach 121 points through strategic card play and combinations.
        </Text>
      </Section>

      <Section title="Game Setup">
        <Text style={styles.text}>
          • Each player gets 6 cards{'\n'}
          • Choose 2 cards to put in the crib{'\n'}
          • Cut deck for starter card
        </Text>
      </Section>

      <Section title="Scoring Points">
        <Text style={styles.text}>
          • Fifteens (2 points){'\n'}
          • Pairs (2 points){'\n'}
          • Runs (1 point per card){'\n'}
          • Flushes (4-5 points){'\n'}
          • Nobs - Jack of starter suit (1 point)
        </Text>
      </Section>

      <Section title="The Play">
        <Text style={styles.text}>
          Players alternate playing cards, trying to make combinations while keeping the running total at 31 or under.
        </Text>
      </Section>

      <Section title="Winning">
        <Text style={styles.text}>
          First to 121 points wins! If you reach 121 during play, you win immediately.
        </Text>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#4ade80',
    marginBottom: 12,
  },
  text: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
  },
});