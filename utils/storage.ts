import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameState } from '@/types/game';

const STORAGE_KEYS = {
  GAME_STATE: 'cribbage_game_state',
  GAME_STATS: 'cribbage_stats',
  SETTINGS: 'cribbage_settings',
} as const;

export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  highestScore: number;
  perfectHands: number;
  twentyNineHands: number;
}

export interface GameSettings {
  difficulty: 'easy' | 'medium' | 'hard';
  soundEnabled: boolean;
  hapticEnabled: boolean;
}

export async function saveGameState(state: GameState): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.GAME_STATE,
      JSON.stringify(state)
    );
  } catch (error) {
    console.error('Error saving game state:', error);
  }
}

export async function loadGameState(): Promise<GameState | null> {
  try {
    const savedState = await AsyncStorage.getItem(STORAGE_KEYS.GAME_STATE);
    return savedState ? JSON.parse(savedState) : null;
  } catch (error) {
    console.error('Error loading game state:', error);
    return null;
  }
}

export async function saveGameStats(stats: GameStats): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.GAME_STATS,
      JSON.stringify(stats)
    );
  } catch (error) {
    console.error('Error saving game stats:', error);
  }
}

export async function loadGameStats(): Promise<GameStats | null> {
  try {
    const savedStats = await AsyncStorage.getItem(STORAGE_KEYS.GAME_STATS);
    return savedStats ? JSON.parse(savedStats) : null;
  } catch (error) {
    console.error('Error loading game stats:', error);
    return null;
  }
}

export async function saveSettings(settings: GameSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify(settings)
    );
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

export async function loadSettings(): Promise<GameSettings | null> {
  try {
    const savedSettings = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    return savedSettings ? JSON.parse(savedSettings) : null;
  } catch (error) {
    console.error('Error loading settings:', error);
    return null;
  }
}

export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.GAME_STATE,
      STORAGE_KEYS.GAME_STATS,
      STORAGE_KEYS.SETTINGS,
    ]);
  } catch (error) {
    console.error('Error clearing data:', error);
  }
}