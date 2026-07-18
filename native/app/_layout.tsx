import { Baloo2_700Bold, Baloo2_800ExtraBold, useFonts } from '@expo-google-fonts/baloo-2';
import { Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initAudio, applyAudioSettings, pauseMusic, resumeMusic } from '../lib/audio';
import { getSettings } from '../lib/settings';
import { COLORS } from '../lib/theme';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Baloo2_700Bold, Baloo2_800ExtraBold, Nunito_600SemiBold, Nunito_700Bold,
  });

  useEffect(() => {
    void initAudio().then(() => getSettings().then(applyAudioSettings));
    const sub = AppState.addEventListener('change', s => {
      if (s === 'active') resumeMusic();
      else pauseMusic();
    });
    return () => sub.remove();
  }, []);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: COLORS.bg }} />;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.bg } }}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
