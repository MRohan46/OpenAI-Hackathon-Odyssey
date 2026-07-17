import React from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '../theme/tokens';
import { Chip } from './Chip';
import { Typography } from './Typography';

interface ChoiceGroupProps<T extends string> {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  labels?: Partial<Record<T, string>>;
}

export function ChoiceGroup<T extends string>({ label, value, options, onChange, labels }: ChoiceGroupProps<T>) {
  return (
    <View style={styles.wrap}>
      <Typography variant="label">{label}</Typography>
      <View style={styles.options}>
        {options.map((option) => (
          <Chip
            key={option}
            label={labels?.[option] ?? `${option.charAt(0).toUpperCase()}${option.slice(1)}`}
            selected={value === option}
            tone={value === option ? 'water' : 'default'}
            onPress={() => onChange(option)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
});
