import React from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { colors, spacing } from '../theme/tokens';
import { Typography } from './Typography';

interface SwitchRowProps {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export function SwitchRow({ label, description, value, onValueChange }: SwitchRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Typography variant="label">{label}</Typography>
        <Typography variant="micro" color={colors.inkSecondary}>
          {description}
        </Typography>
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.line, true: colors.water }}
        thumbColor={colors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  copy: { flex: 1, gap: 3 },
});
