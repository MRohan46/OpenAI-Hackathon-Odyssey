import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Button } from '../../src/components/Button';
import { ChoiceGroup } from '../../src/components/ChoiceGroup';
import { Field } from '../../src/components/Field';
import { LivingScreen } from '../../src/components/LivingScreen';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Surface } from '../../src/components/Surface';
import { Typography } from '../../src/components/Typography';
import { useApp } from '../../src/state/AppProvider';
import type { Intensity, Priority, ProofPolicy, QuestKind } from '../../src/types/domain';
import { colors, spacing } from '../../src/theme/tokens';

export default function NewQuestScreen() {
  const router = useRouter();
  const { goals, createQuest } = useApp();
  const [title, setTitle] = useState('Practice one timed calculus set');
  const [description, setDescription] = useState('Complete the set without notes, then review every uncertain step.');
  const [goalId, setGoalId] = useState(goals[0]?.id ?? '');
  const [kind, setKind] = useState<QuestKind>('habit');
  const [scheduledAt, setScheduledAt] = useState('2026-07-18T19:00:00+05:30');
  const [deadlineAt, setDeadlineAt] = useState('2026-07-18T20:15:00+05:30');
  const [duration, setDuration] = useState('45');
  const [priority, setPriority] = useState<Priority>('high');
  const [intensity, setIntensity] = useState<Intensity>('normal');
  const [recurrence, setRecurrence] = useState('Monday, Wednesday, Friday');
  const [proofPolicy, setProofPolicy] = useState<ProofPolicy>('optional');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (title.trim().length < 3 || !goalId || Number(duration) < 5) return setError('Add a useful title, connected Odyssey, and duration of at least 5 minutes.');
    setSaving(true);
    const quest = await createQuest({
      title: title.trim(), description: description.trim(), goalId, kind, scheduledAt,
      deadlineAt: deadlineAt || undefined, durationMinutes: Number(duration), priority,
      plannedIntensity: intensity, recurrence: kind === 'habit' ? recurrence : undefined, proofPolicy,
    });
    setSaving(false);
    if (!quest) setError('The quest was not confirmed. Your draft remains on this screen.');
    else router.replace(`/quest/${quest.id}`);
  };

  return (
    <LivingScreen dim={0.26}>
      <ScreenHeader back title="Create a quest" eyebrow="A meaningful next step" />
      <Surface padding="large" style={styles.form}>
        <ChoiceGroup label="Quest type" value={kind} options={['habit', 'task'] as const} onChange={setKind} labels={{ habit: 'Recurring habit', task: 'One-time task' }} />
        <Field label="Quest title" value={title} onChangeText={setTitle} />
        <Field label="Useful description" value={description} onChangeText={setDescription} multiline />
        <ChoiceGroup label="Connected Odyssey" value={goalId} options={goals.map((goal) => goal.id)} labels={Object.fromEntries(goals.map((goal) => [goal.id, goal.shortTitle]))} onChange={setGoalId} />
        <Field label="Scheduled date and time" value={scheduledAt} onChangeText={setScheduledAt} help="ISO local time until the native picker is connected." />
        <Field label="Deadline (optional)" value={deadlineAt} onChangeText={setDeadlineAt} />
        <Field label="Duration in minutes" value={duration} onChangeText={setDuration} keyboardType="number-pad" />
        <ChoiceGroup label="Priority" value={priority} options={['low', 'medium', 'high', 'critical'] as const} onChange={setPriority} />
        <ChoiceGroup label="Planned intensity" value={intensity} options={['light', 'normal', 'intense'] as const} onChange={setIntensity} />
        {kind === 'habit' ? <Field label="Recurrence" value={recurrence} onChangeText={setRecurrence} help="Each occurrence keeps its own status, effort, proof, and reward history." /> : null}
        <ChoiceGroup label="Private photo proof" value={proofPolicy} options={['none', 'optional', 'required'] as const} onChange={setProofPolicy} />
        <Typography variant="micro" color={colors.inkSecondary}>Priority and deadline stay separate. Planned intensity is not overwritten by the effort you record after completion.</Typography>
        {error ? <Typography variant="micro" color={colors.coralText}>{error}</Typography> : null}
        <Button label="Add quest to the calendar" icon={Plus} onPress={save} loading={saving} />
      </Surface>
    </LivingScreen>
  );
}
const styles = StyleSheet.create({ form: { gap: spacing.lg } });
