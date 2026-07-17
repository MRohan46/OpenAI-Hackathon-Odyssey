import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '../theme/tokens';
import { Typography } from './Typography';

interface StatCardProps {
  icon: LucideIcon;
  value: string;
  label: string;
  color?: string;
}

export function StatCard({ icon: Icon, value, label, color = colors.waterDeep }: StatCardProps) {
  return (
    <View style={styles.card}>
      <Icon size={20} color={color} />
      <Typography variant="heading">{value}</Typography>
      <Typography variant="micro" color={colors.inkSecondary}>{label}</Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 104, padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.mistStrong, borderWidth: 1, borderColor: colors.line, gap: 5 },
});
