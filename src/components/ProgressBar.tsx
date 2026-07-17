import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radii } from '../theme/tokens';

interface ProgressBarProps {
  value: number;
  color?: string;
  trackColor?: string;
  height?: number;
  accessibilityLabel: string;
}

export function ProgressBar({
  value,
  color = colors.sun,
  trackColor = colors.line,
  height = 8,
  accessibilityLabel,
}: ProgressBarProps) {
  const bounded = Math.max(0, Math.min(100, value));
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: bounded }}
      style={[styles.track, { height, backgroundColor: trackColor }]}
    >
      <View style={[styles.fill, { width: `${bounded}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden', borderRadius: radii.pill },
  fill: { height: '100%', borderRadius: radii.pill },
});
