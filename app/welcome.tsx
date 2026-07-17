import { useRouter } from 'expo-router';
import { ArrowRight, Compass, ShieldCheck, Sparkles } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '../src/components/Button';
import { LivingScreen } from '../src/components/LivingScreen';
import { Surface } from '../src/components/Surface';
import { Typography } from '../src/components/Typography';
import { colors, spacing } from '../src/theme/tokens';

export default function WelcomeScreen() {
  const router = useRouter();
  return (
    <LivingScreen immersive dim={0.02} contentStyle={styles.content} testID="welcome-screen">
      <View style={styles.brand}>
        <View style={styles.mark}><Compass size={23} color={colors.ink} /></View>
        <Typography variant="label">ODYSSEY</Typography>
      </View>
      <View style={styles.hero}>
        <Typography variant="hero">Begin at the shore.</Typography>
        <Typography variant="body" color={colors.inkSecondary} style={styles.lede}>
          Turn one meaningful goal into a clear path of quests, honest progress, and victories you actually earned.
        </Typography>
      </View>
      <Surface padding="medium" style={styles.promise}>
        <View style={styles.promiseRow}><Sparkles size={19} color={colors.sun} /><Typography variant="label">AI charts the route. You approve every step.</Typography></View>
        <View style={styles.promiseRow}><ShieldCheck size={19} color={colors.waterDeep} /><Typography variant="label">Your goals and proof stay private.</Typography></View>
      </Surface>
      <View style={styles.actions}>
        <Button label="Start an Odyssey" icon={ArrowRight} onPress={() => router.push('/sign-up')} />
        <Button label="I already have a journey" variant="secondary" onPress={() => router.push('/sign-in')} />
        <Button label="Explore the demo" variant="ghost" onPress={() => router.replace('/(tabs)/today')} />
      </View>
    </LivingScreen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'space-between', paddingTop: spacing.md },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  mark: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.mistStrong, alignItems: 'center', justifyContent: 'center' },
  hero: { gap: spacing.md, paddingTop: 90 },
  lede: { maxWidth: 350 },
  promise: { gap: spacing.sm },
  promiseRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  actions: { gap: spacing.sm },
});
