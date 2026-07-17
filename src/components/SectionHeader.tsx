import { ChevronRight } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, spacing } from '../theme/tokens';
import { Typography } from './Typography';

interface SectionHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, description, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Typography variant="heading">{title}</Typography>
        {description ? (
          <Typography variant="micro" color={colors.inkSecondary}>
            {description}
          </Typography>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" accessibilityLabel={actionLabel} onPress={onAction} style={styles.action}>
          <Typography variant="micro">{actionLabel}</Typography>
          <ChevronRight size={16} color={colors.ink} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  copy: { flex: 1, gap: 2 },
  action: { flexDirection: 'row', alignItems: 'center', minHeight: 44, paddingLeft: spacing.sm },
});
