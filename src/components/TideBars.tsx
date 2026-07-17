import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useReducedMotion } from '../hooks/useReducedMotion';
import { colors, radii, spacing } from '../theme/tokens';
import { Typography } from './Typography';

interface TideBarsProps {
  data: { label: string; value: number; comparison?: number }[];
  accessibilityLabel: string;
}

function Bar({ value, comparison, max, animate }: { value: number; comparison?: number; max: number; animate: boolean }) {
  const progress = useSharedValue(animate ? 0 : 1);
  useEffect(() => {
    progress.value = withTiming(1, { duration: animate ? 720 : 0, easing: Easing.out(Easing.cubic) });
  }, [animate, progress]);
  const height = Math.max(4, (value / max) * 116);
  const comparisonHeight = comparison === undefined ? 0 : Math.max(4, (comparison / max) * 116);
  const style = useAnimatedStyle(() => ({ height: height * progress.value }));
  const comparisonStyle = useAnimatedStyle(() => ({ height: comparisonHeight * progress.value }));
  return (
    <View style={styles.barSlot}>
      {comparison !== undefined ? <Animated.View style={[styles.bar, styles.comparison, comparisonStyle]} /> : null}
      <Animated.View style={[styles.bar, styles.primary, style]} />
    </View>
  );
}

export function TideBars({ data, accessibilityLabel }: TideBarsProps) {
  const reducedMotion = useReducedMotion();
  const max = Math.max(1, ...data.flatMap((item) => [item.value, item.comparison ?? 0]));
  return (
    <View accessibilityRole="image" accessibilityLabel={accessibilityLabel} style={styles.wrap}>
      <View style={styles.chart}>
        {data.map((item) => (
          <View key={item.label} style={styles.column}>
            <Bar value={item.value} comparison={item.comparison} max={max} animate={!reducedMotion} />
            <Typography variant="micro" color={colors.inkSecondary}>{item.label}</Typography>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', paddingTop: spacing.sm },
  chart: { height: 146, flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.line },
  column: { flex: 1, alignItems: 'center', gap: spacing.xs },
  barSlot: { height: 118, width: '100%', maxWidth: 28, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 2 },
  bar: { flex: 1, minWidth: 5, maxWidth: 12, borderTopLeftRadius: radii.sm, borderTopRightRadius: radii.sm },
  primary: { backgroundColor: colors.water },
  comparison: { backgroundColor: colors.sun },
});
