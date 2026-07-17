import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '../theme/tokens';
import { Typography } from './Typography';

interface ChipProps {
  label: string;
  selected?: boolean;
  tone?: 'default' | 'sun' | 'coral' | 'water' | 'success';
  onPress?: () => void;
  dot?: boolean;
}

const toneColor = {
  default: colors.inkSecondary,
  sun: colors.sun,
  coral: colors.coral,
  water: colors.water,
  success: colors.success,
};

export function Chip({ label, selected = false, tone = 'default', onPress, dot = false }: ChipProps) {
  const foreground = selected ? colors.white : tone === 'default' ? colors.ink : toneColor[tone];
  const background = selected ? (tone === 'default' ? colors.ink : toneColor[tone]) : colors.mistStrong;
  const content = (
    <>
      {dot ? <View style={[styles.dot, { backgroundColor: toneColor[tone] }]} /> : null}
      <Typography variant="micro" color={foreground}>
        {label}
      </Typography>
    </>
  );
  if (!onPress) return <View style={[styles.base, { backgroundColor: background }]}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      aria-pressed={selected}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles.interactive,
        { backgroundColor: background },
        pressed && styles.pressed,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 34,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.line,
  },
  interactive: { minHeight: 48 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  pressed: { opacity: 0.82 },
});
