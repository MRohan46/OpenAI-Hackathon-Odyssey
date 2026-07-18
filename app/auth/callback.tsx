import { useURL } from 'expo-linking';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { LivingScreen } from '../../src/components/LivingScreen';
import { Typography } from '../../src/components/Typography';
import { supabase } from '../../src/lib/supabase';
import { colors, spacing } from '../../src/theme/tokens';

export default function AuthCallbackScreen() {
  const url = useURL();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const client = supabase;

  useEffect(() => {
    if (!url || !client) return;

    const callback = new URL(url);
    const code = callback.searchParams.get('code');
    const tokens = new URLSearchParams(callback.hash.replace(/^#/, ''));
    const accessToken = tokens.get('access_token');
    const refreshToken = tokens.get('refresh_token');

    const complete = async () => {
      const response = code
        ? await client.auth.exchangeCodeForSession(code)
        : accessToken && refreshToken
          ? await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          : { error: new Error('The confirmation link did not contain an Odyssey session.') };
      if (response.error) {
        setError(response.error.message);
        return;
      }
      router.replace('/(tabs)/today');
    };

    void complete();
  }, [client, router, url]);

  if (!client) {
    return (
      <LivingScreen dim={0.28}>
        <View style={styles.content}><Typography variant="body" color={colors.coralText}>Supabase is not configured on this build.</Typography></View>
      </LivingScreen>
    );
  }

  return (
    <LivingScreen dim={0.28}>
      <View style={styles.content}>
        {error ? <Typography variant="body" color={colors.coralText}>{error}</Typography> : <><ActivityIndicator color={colors.waterDeep} /><Typography variant="heading">Opening your Odyssey…</Typography></>}
      </View>
    </LivingScreen>
  );
}

const styles = StyleSheet.create({ content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl } });
