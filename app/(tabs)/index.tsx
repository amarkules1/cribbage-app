import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { SplashScreen } from 'expo-router';
import { useGameStore } from '@/store/gameStore';
import { Play, BookOpen, Settings, RotateCcw } from 'lucide-react-native';
import { useEffect } from 'react';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function HomeScreen() {
  const router = useRouter();
  const startNewGame = useGameStore((state) => state.startNewGame);
  const hasGameInProgress = useGameStore((state) => state.hasGameInProgress());

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  const handleStartGame = () => {
    startNewGame();
    router.push('/game');
  };

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=800&auto=format&fit=crop' }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.overlay} />
      
      <View style={styles.content}>
        <Text style={styles.title}>Cribbage</Text>
        <Text style={styles.subtitle}>A Classic Card Game</Text>

        <View style={styles.buttonContainer}>
          <Pressable style={styles.mainButton} onPress={handleStartGame}>
            <Play color="#fff" size={24} />
            <Text style={styles.mainButtonText}>New Game</Text>
          </Pressable>

          <Pressable
            style={[styles.mainButton, styles.resumeButton, !hasGameInProgress && styles.disabledButton]}
            onPress={() => router.push('/game')}
            disabled={!hasGameInProgress}>
            <RotateCcw color="#fff" size={24} />
            <Text style={styles.mainButtonText}>Resume Game</Text>
          </Pressable>

          <View style={styles.secondaryButtons}>
            <Pressable style={styles.secondaryButton} onPress={() => router.push('/rules')}>
              <BookOpen color="#fff" size={20} />
              <Text style={styles.secondaryButtonText}>Rules</Text>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={() => router.push('/settings')}>
              <Settings color="#fff" size={20} />
              <Text style={styles.secondaryButtonText}>Settings</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 48,
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 18,
    color: '#4ade80',
    marginBottom: 48,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 16,
  },
  mainButton: {
    backgroundColor: '#4ade80',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  resumeButton: {
    backgroundColor: '#2563eb',
  },
  disabledButton: {
    backgroundColor: '#4b5563',
    opacity: 0.5,
  },
  mainButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#fff',
  },
  secondaryButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#fff',
  },
});