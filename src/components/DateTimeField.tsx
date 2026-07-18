import { addDays, format, isValid, parse } from 'date-fns';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { DateTimeParts } from '../utils/scheduling';
import { colors, spacing } from '../theme/tokens';
import { Chip } from './Chip';
import { Field } from './Field';
import { Typography } from './Typography';

interface DateTimeFieldProps {
  label: string;
  value: DateTimeParts;
  onChange: (value: DateTimeParts) => void;
  optional?: boolean;
}

export function DateTimeField({ label, value, onChange, optional = false }: DateTimeFieldProps) {
  const parsed = parse(`${value.date} ${value.time}`, 'yyyy-MM-dd HH:mm', new Date());
  const setOffset = (days: number) => {
    const base = isValid(parsed) ? parsed : new Date();
    onChange({ date: format(addDays(base, days), 'yyyy-MM-dd'), time: value.time || '09:00' });
  };

  return (
    <View style={styles.wrap}>
      <Typography variant="label">{label}{optional ? ' (optional)' : ''}</Typography>
      <View style={styles.quick}>
        <Chip label="Today" onPress={() => setOffset(0)} />
        <Chip label="Tomorrow" onPress={() => setOffset(1)} />
        <Chip label="Next week" onPress={() => setOffset(7)} />
        {optional && value.date ? <Chip label="Clear" tone="coral" onPress={() => onChange({ date: '', time: '' })} /> : null}
      </View>
      <View style={styles.inputs}>
        <View style={styles.input}><Field label="Date" value={value.date} placeholder="YYYY-MM-DD" onChangeText={(date) => onChange({ ...value, date })} /></View>
        <View style={styles.input}><Field label="Time" value={value.time} placeholder="HH:MM" onChangeText={(time) => onChange({ ...value, time })} /></View>
      </View>
      <Typography variant="micro" color={colors.inkSecondary}>Local date and 24-hour time. Quick choices keep this calendar-first without exposing raw ISO timestamps.</Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  quick: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  inputs: { flexDirection: 'row', gap: spacing.sm },
  input: { flex: 1 },
});
