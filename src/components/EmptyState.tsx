import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '../theme/tokens';
import { Button } from './Button';
import { Typography } from './Typography';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.icon}><Icon size={28} color={colors.waterDeep} /></View>
      <Typography variant="heading" style={styles.center}>{title}</Typography>
      <Typography variant="body" color={colors.inkSecondary} style={styles.center}>{message}</Typography>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} variant="secondary" compact /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.sm, padding: spacing.xl },
  icon: { width: 56, height: 56, borderRadius: radii.pill, backgroundColor: colors.sky, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
});
