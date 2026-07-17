import { useLocalSearchParams, useRouter } from 'expo-router';
import { Save, Shield } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Button } from '../../../src/components/Button';
import { EmptyState } from '../../../src/components/EmptyState';
import { Field } from '../../../src/components/Field';
import { LivingScreen } from '../../../src/components/LivingScreen';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { Surface } from '../../../src/components/Surface';
import { Typography } from '../../../src/components/Typography';
import { useApp } from '../../../src/state/AppProvider';
import { colors, spacing } from '../../../src/theme/tokens';
import { toShortTitle } from '../../../src/utils/format';

export default function EditGoalScreen() {
  const { goalId } = useLocalSearchParams<{ goalId: string }>();
  const router = useRouter();
  const { goals, updateGoal } = useApp();
  const goal = goals.find((item) => item.id === goalId);
  const [title, setTitle] = useState(goal?.title ?? '');
  const [description, setDescription] = useState(goal?.description ?? '');
  const [deadline, setDeadline] = useState(goal?.deadline ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!goal) return <LivingScreen><ScreenHeader back /><EmptyState icon={Shield} title="Goal unavailable" message="This goal cannot be edited from the current link." /></LivingScreen>;
  const save = async () => {
    if (!title.trim() || !deadline) return setError('Keep a clear title and deadline.');
    setSaving(true);
    const result = await updateGoal(goal.id, { title: title.trim(), shortTitle: toShortTitle(title), description, deadline });
    setSaving(false);
    if (result) setError(result); else router.back();
  };
  return (
    <LivingScreen dim={0.26}>
      <ScreenHeader back title="Edit the destination" eyebrow="Goal presentation" />
      <Typography variant="body" color={colors.inkSecondary}>This changes the goal’s presentation. It does not silently rewrite accepted stages or completed history.</Typography>
      <Surface padding="large" style={styles.form}>
        <Field label="Goal" value={title} onChangeText={setTitle} multiline />
        <Field label="Description" value={description} onChangeText={setDescription} multiline />
        <Field label="Deadline" value={deadline} onChangeText={setDeadline} placeholder="YYYY-MM-DD" />
        {error ? <Typography variant="micro" color={colors.coralText}>{error}</Typography> : null}
        <Button label="Save goal" icon={Save} onPress={save} loading={saving} />
      </Surface>
    </LivingScreen>
  );
}
const styles = StyleSheet.create({ form: { gap: spacing.lg } });
