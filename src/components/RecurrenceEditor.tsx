import React from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '../theme/tokens';
import type { RecurrenceDraft, RecurrenceFrequency } from '../utils/scheduling';
import { formatRecurrence, weekdayOptions } from '../utils/scheduling';
import { Chip } from './Chip';
import { ChoiceGroup } from './ChoiceGroup';
import { Field } from './Field';
import { Typography } from './Typography';

interface RecurrenceEditorProps {
  value: RecurrenceDraft;
  onChange: (value: RecurrenceDraft) => void;
}

export function RecurrenceEditor({ value, onChange }: RecurrenceEditorProps) {
  const toggleDay = (day: string) => onChange({
    ...value,
    days: value.days.includes(day) ? value.days.filter((item) => item !== day) : [...value.days, day],
  });

  return (
    <View style={styles.wrap}>
      <ChoiceGroup<RecurrenceFrequency>
        label="Recurrence"
        value={value.frequency}
        options={['daily', 'weekly', 'custom']}
        labels={{ daily: 'Every day', weekly: 'Selected days', custom: 'Custom interval' }}
        onChange={(frequency) => onChange({ ...value, frequency })}
      />
      {value.frequency === 'weekly' ? (
        <View style={styles.wrap}>
          <Typography variant="label">Repeat on</Typography>
          <View style={styles.days}>
            {weekdayOptions.map((day) => <Chip key={day} label={day} selected={value.days.includes(day)} tone="water" onPress={() => toggleDay(day)} />)}
          </View>
        </View>
      ) : null}
      {value.frequency === 'custom' ? (
        <Field label="Repeat every number of days" value={String(value.interval)} keyboardType="number-pad" onChangeText={(text) => onChange({ ...value, interval: Math.max(2, Number(text) || 2) })} />
      ) : null}
      <Typography variant="label">Preview · {formatRecurrence(value)}</Typography>
      <Typography variant="micro">Each scheduled occurrence keeps its own completion, effort, proof, and reward history.</Typography>
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { gap: spacing.sm }, days: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs } });
