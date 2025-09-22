import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useFonts, Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold } from '@expo-google-fonts/manrope';
import SessionScreen from './src/features/session/SessionScreen';
import OnboardingScreen from './src/features/onboarding/OnboardingScreen';
import { theme } from './src/theme/theme';
import { useEffect, useState } from 'react';
import { getPreferences } from './src/services/preferences';

export default function App() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const prefs = await getPreferences();
      setOnboarded(Boolean(prefs?.onboardingComplete));
    })();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <StatusBar style="light" />
      </View>
    );
  }

  if (onboarded === null) {
    return (
      <View style={styles.loading}>
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {onboarded ? (
        <SessionScreen />
      ) : (
        <OnboardingScreen onDone={() => setOnboarded(true)} />
      )}
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.bg,
  },
});
