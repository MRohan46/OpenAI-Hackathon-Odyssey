import React from 'react';
import { Pressable, StyleSheet, View, type ViewProps } from 'react-native';

import { colors, radii, shadows, spacing } from '../theme/tokens';

interface SurfaceProps extends ViewProps {
  tone?: 'mist' | 'solid' | 'sand' | 'ink';
  onPress?: () => void;
  accessibilityLabel?: string;
  padding?: 'none' | 'small' | 'medium' | 'large';
}

const paddingMap = { none: 0, small: spacing.sm, medium: spacing.md, large: spacing.lg };

export function Surface({
  tone = 'mist',
  onPress,
  accessibilityLabel,
  padding = 'medium',
  style,
  children,
  ...props
}: SurfaceProps) {
  const backgroundColor =
    tone === 'solid' ? colors.white : tone === 'sand' ? colors.sand : tone === 'ink' ? colors.ink : colors.mist;
  const shared = [styles.base, { backgroundColor, padding: paddingMap[padding] }, style];

  if (onPress) {
    return (
      <Pressable
        {...props}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [shared, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <View {...props} style={shared}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
    ...shadows,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.992 }] },
});
