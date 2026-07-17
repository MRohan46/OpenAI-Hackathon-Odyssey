import { useLocalSearchParams, useRouter } from 'expo-router';
import { Gem, Gift, Sparkles } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { Button } from '../../../src/components/Button';
import { LivingScreen } from '../../../src/components/LivingScreen';
import { LoadingTide } from '../../../src/components/LoadingTide';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { Surface } from '../../../src/components/Surface';
import { Typography } from '../../../src/components/Typography';
import { useReducedMotion } from '../../../src/hooks/useReducedMotion';
import { useApp } from '../../../src/state/AppProvider';
import { colors, spacing } from '../../../src/theme/tokens';

export default function ChestScreen() {
  const { chestId } = useLocalSearchParams<{ chestId: string }>();
  const router = useRouter();
  const { chestState, chestReceipt, openChest } = useApp();
  const reducedMotion = useReducedMotion();
  const float = useSharedValue(0);
  useEffect(() => {
    if (!reducedMotion) float.value = withRepeat(withSequence(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 900, easing: Easing.inOut(Easing.sin) })), -1);
  }, [float, reducedMotion]);
  const chestStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -float.value * 10 }, { rotateY: `${float.value * 8}deg` }, { scale: 1 + float.value * 0.03 }] }));
  if (chestState === 'pending') return <LivingScreen immersive dim={0.06} contentStyle={styles.centerContent}><ScreenHeader back /><LoadingTide label="Opening only what you earned…" /></LivingScreen>;
  if (chestState === 'confirmed' && chestReceipt) return (
    <LivingScreen immersive dim={0.04} contentStyle={styles.centerContent}>
      <View style={styles.burst}><Sparkles size={42} color={colors.sun} /></View>
      <Typography variant="display" style={styles.center}>Chest confirmed.</Typography>
      <Surface tone="ink" padding="large" style={styles.receipt}>
        <View style={styles.item}><Sparkles size={20} color={colors.sun} /><Typography variant="heading" color={colors.white}>+{chestReceipt.xp} XP</Typography></View>
        <View style={styles.item}><Gem size={20} color={colors.water} /><Typography variant="heading" color={colors.white}>+{chestReceipt.rubies} rubies</Typography></View>
        {chestReceipt.cosmetic ? <View style={styles.item}><Gift size={20} color={colors.coral} /><Typography variant="heading" color={colors.white}>{chestReceipt.cosmetic}</Typography></View> : null}
      </Surface>
      <Button label="Return to rewards" onPress={() => router.replace('/rewards')} />
    </LivingScreen>
  );
  return (
    <LivingScreen immersive dim={0.04} contentStyle={styles.centerContent}>
      <ScreenHeader back eyebrow="Earned chest" />
      <Animated.View style={[styles.chest, chestStyle]}><Gift size={74} color={colors.ink} strokeWidth={1.5} /></Animated.View>
      <Typography variant="display" style={styles.center}>The tide brought something back.</Typography>
      <Typography variant="body" color={colors.inkSecondary} style={styles.center}>Opening reveals a server-confirmed receipt. The animation itself never changes your balance.</Typography>
      {chestState === 'failed' ? <Typography variant="micro" color={colors.coralText}>No chest was confirmed. Your balances did not move.</Typography> : null}
      <Button label="Open earned chest" icon={Sparkles} onPress={async () => { await openChest(chestId); }} />
    </LivingScreen>
  );
}
const styles = StyleSheet.create({
  centerContent: { flex: 1, justifyContent: 'center' }, center: { textAlign: 'center' }, chest: { width: 150, height: 150, borderRadius: 75, alignSelf: 'center', backgroundColor: colors.mistStrong, borderWidth: 2, borderColor: colors.sun, alignItems: 'center', justifyContent: 'center' },
  burst: { width: 92, height: 92, borderRadius: 46, alignSelf: 'center', backgroundColor: colors.mistStrong, alignItems: 'center', justifyContent: 'center' }, receipt: { gap: spacing.md }, item: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
