import { addDays, format, isValid, parse } from 'date-fns';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '../theme/tokens';
import { Chip } from './Chip';
import { Field } from './Field';

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function DateField({ label, value, onChange }: DateFieldProps) {
  const parsed = parse(value, 'yyyy-MM-dd', new Date());
  const setOffset = (days: number) => onChange(format(addDays(isValid(parsed) ? parsed : new Date(), days), 'yyyy-MM-dd'));
  return (
    <View style={styles.wrap}>
      <Field label={label} value={value} onChangeText={onChange} placeholder="YYYY-MM-DD" help="Choose a useful horizon or enter a local calendar date." />
      <View style={styles.options}><Chip label="+30 days" onPress={() => setOffset(30)} /><Chip label="+60 days" onPress={() => setOffset(60)} /><Chip label="+90 days" onPress={() => setOffset(90)} /></View>
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { gap: spacing.xs }, options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs } });
