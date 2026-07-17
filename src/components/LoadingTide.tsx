import { Waves } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { useReducedMotion } from '../hooks/useReducedMotion';
import { colors, radii, spacing } from '../theme/tokens';
import { Typography } from './Typography';

export function LoadingTide({ label = 'Reading the tide…' }: { label?: string }) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);
  useEffect(() => {
    if (!reducedMotion) progress.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [progress, reducedMotion]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: reducedMotion ? 0 : -10 + progress.value * 20 }] }));
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={label} style={styles.wrap}>
      <Animated.View style={style}><Waves size={28} color={colors.waterDeep} /></Animated.View>
      <Typography variant="label">{label}</Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.sm, padding: spacing.xl, backgroundColor: colors.mist, borderRadius: radii.lg },
});
