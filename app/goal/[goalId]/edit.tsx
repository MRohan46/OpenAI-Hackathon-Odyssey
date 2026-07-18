import { useLocalSearchParams, useRouter } from 'expo-router';
import { Save, Shield } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '../../../src/components/Button';
import { Chip } from '../../../src/components/Chip';
import { ChoiceGroup } from '../../../src/components/ChoiceGroup';
import { DateField } from '../../../src/components/DateField';
import { EmptyState } from '../../../src/components/EmptyState';
import { Field } from '../../../src/components/Field';
import { LivingScreen } from '../../../src/components/LivingScreen';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { Surface } from '../../../src/components/Surface';
import { Typography } from '../../../src/components/Typography';
import { useApp } from '../../../src/state/AppProvider';
import type { Intensity } from '../../../src/types/domain';
import { colors, spacing } from '../../../src/theme/tokens';
import { toShortTitle } from '../../../src/utils/format';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function EditGoalScreen() {
  const { goalId } = useLocalSearchParams<{ goalId: string }>();
  const router = useRouter();
  const { goals, updateGoal } = useApp();
  const goal = goals.find((item) => item.id === goalId && item.status === 'active');
  const [title, setTitle] = useState(goal?.title ?? '');
  const [description, setDescription] = useState(goal?.description ?? '');
  const [deadline, setDeadline] = useState(goal?.deadline ?? '');
  const [startingPoint, setStartingPoint] = useState(goal?.startingPoint ?? '');
  const [availableDays, setAvailableDays] = useState(goal?.availableDays ?? []);
  const [minutes, setMinutes] = useState(String(goal?.minutesPerDay ?? 30));
  const [intensity, setIntensity] = useState<Intensity>(goal?.preferredIntensity ?? 'normal');
  const [constraints, setConstraints] = useState(goal?.constraints ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!goal) return <LivingScreen><ScreenHeader back /><EmptyState icon={Shield} title="Goal unavailable" message="Only an active Odyssey can change its destination or future planning constraints." /></LivingScreen>;

  const save = async () => {
    if (!title.trim() || !deadline || availableDays.length === 0 || Number(minutes) < 10) {
      setError('Keep a clear title, deadline, available day, and at least ten minutes per session.');
      return;
    }
    setSaving(true);
    setError(null);
    const result = await updateGoal(goal.id, {
      title: title.trim(),
      shortTitle: toShortTitle(title),
      description,
      deadline,
      startingPoint,
      availableDays,
      minutesPerDay: Number(minutes),
      preferredIntensity: intensity,
      constraints,
    });
    setSaving(false);
    if (result) setError(result); else router.back();
  };

  return (
    <LivingScreen dim={0.26}>
      <ScreenHeader back title="Edit the destination" eyebrow="Goal and future constraints" />
      <Typography variant="body" color={colors.inkSecondary}>These changes guide future planning. They do not silently rewrite accepted stages or completed history; use Edit route for explicit stage changes.</Typography>
      <Surface padding="large" style={styles.form}>
        <Field label="Goal" value={title} onChangeText={setTitle} multiline />
        <Field label="Description" value={description} onChangeText={setDescription} multiline />
        <DateField label="Deadline" value={deadline} onChange={setDeadline} />
        <Field label="Current starting point" value={startingPoint} onChangeText={setStartingPoint} multiline />
        <View style={styles.group}><Typography variant="label">Days available</Typography><View style={styles.chips}>{days.map((day) => <Chip key={day} label={day} selected={availableDays.includes(day)} tone="water" onPress={() => setAvailableDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day])} />)}</View></View>
        <Field label="Minutes per available day" value={minutes} onChangeText={setMinutes} keyboardType="number-pad" />
        <ChoiceGroup label="Preferred effort" value={intensity} options={['light', 'normal', 'intense'] as const} onChange={setIntensity} />
        <Field label="Real-life constraints" value={constraints} onChangeText={setConstraints} multiline />
        {error ? <Typography variant="micro" color={colors.coralText}>{error}</Typography> : null}
        <Button label="Save future planning context" icon={Save} onPress={save} loading={saving} />
      </Surface>
    </LivingScreen>
  );
}

const styles = StyleSheet.create({ form: { gap: spacing.lg }, group: { gap: spacing.xs }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs } });
