import * as Haptics from 'expo-haptics';
import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { useApp } from '../state/AppProvider';
import { colors, radii, shadows, spacing } from '../theme/tokens';
import { Typography } from './Typography';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'coral';

interface ButtonProps {
  label: string;
  onPress: () => void | Promise<void>;
  variant?: ButtonVariant;
  icon?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
  compact?: boolean;
}

const variants: Record<ButtonVariant, { background: string; foreground: string; border: string }> = {
  primary: { background: colors.ink, foreground: colors.white, border: colors.ink },
  secondary: { background: colors.mistStrong, foreground: colors.ink, border: colors.line },
  ghost: { background: colors.transparent, foreground: colors.ink, border: colors.transparent },
  coral: { background: colors.coral, foreground: colors.white, border: colors.coral },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon: Icon,
  loading = false,
  disabled = false,
  accessibilityHint,
  compact = false,
}: ButtonProps) {
  const { preferences } = useApp();
  const palette = variants[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      disabled={disabled || loading}
      onPress={async () => {
        if (preferences.haptics) await Haptics.selectionAsync().catch(() => undefined);
        await onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        compact ? styles.compact : styles.regular,
        { backgroundColor: palette.background, borderColor: palette.border },
        variant === 'primary' ? shadows : undefined,
        pressed && !disabled ? styles.pressed : undefined,
        disabled ? styles.disabled : undefined,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.foreground} />
      ) : (
        <View style={styles.content}>
          {Icon ? <Icon size={compact ? 17 : 19} strokeWidth={2.2} color={palette.foreground} /> : null}
          <Typography variant="label" color={palette.foreground} style={styles.label}>
            {label}
          </Typography>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  regular: { minHeight: 56, paddingHorizontal: spacing.lg },
  compact: { minHeight: 44, paddingHorizontal: spacing.md },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  label: { textAlign: 'center' },
  pressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.48 },
});
