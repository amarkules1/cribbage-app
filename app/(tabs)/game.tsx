import { View, StyleSheet } from 'react-native';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { useEffect } from 'react';
import { SplashScreen } from 'expo-router';
import { GameBoard } from '@/components/GameBoard';
import { useGameStore } from '@/store/gameStore';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function GameScreen() {
  const startNewGame = useGameStore((state) => state.startNewGame);
  
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    startNewGame();
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <View style={styles.container}>
      <GameBoard />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
});