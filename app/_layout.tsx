import {
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  useFonts as useBricolageFonts,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  useFonts as useManropeFonts,
} from '@expo-google-fonts/manrope';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProvider } from '../src/state/AppProvider';
import { colors } from '../src/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1 } } }));
  const [bricolageLoaded, bricolageError] = useBricolageFonts({
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
  });
  const [manropeLoaded, manropeError] = useManropeFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });
  const fontLoadError = bricolageError ?? manropeError;
  const ready = (bricolageLoaded && manropeLoaded) || Boolean(fontLoadError);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  useEffect(() => {
    if (fontLoadError) {
      console.warn('[fonts] Custom fonts failed to load; continuing with platform fallbacks.', fontLoadError);
    }
  }, [fontLoadError]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: colors.sand } }} />
          </AppProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
