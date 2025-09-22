import AsyncStorage from '@react-native-async-storage/async-storage';

export type Preferences = {
  topics: string[];
  routineMinutes: number;
  onboardingComplete: boolean;
};

const PREFS_KEY = 'prefs_v1';

export async function getPreferences(): Promise<Preferences | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Preferences;
  } catch {
    return null;
  }
}

export async function savePreferences(prefs: Preferences): Promise<void> {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}


