import { format } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Button } from '../../src/components/Button';
import { ChoiceGroup } from '../../src/components/ChoiceGroup';
import { DateTimeField } from '../../src/components/DateTimeField';
import { Field } from '../../src/components/Field';
import { LivingScreen } from '../../src/components/LivingScreen';
import { RecurrenceEditor } from '../../src/components/RecurrenceEditor';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Surface } from '../../src/components/Surface';
import { Typography } from '../../src/components/Typography';
import { useApp } from '../../src/state/AppProvider';
import type { Intensity, Priority, ProofPolicy, QuestKind } from '../../src/types/domain';
import { colors, spacing } from '../../src/theme/tokens';
import { formatRecurrence, fromDateTimeParts, type DateTimeParts, type RecurrenceDraft } from '../../src/utils/scheduling';

export default function NewQuestScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string; title?: string; goalId?: string; kind?: QuestKind }>();
  const { goals, createQuest } = useApp();
  const activeGoals = goals.filter((goal) => goal.status === 'active');
  const defaultDate = params.date ?? format(new Date(), 'yyyy-MM-dd');
  const [title, setTitle] = useState(params.title ?? 'Practice one timed calculus set');
  const [description, setDescription] = useState('Complete the set without notes, then review every uncertain step.');
  const [goalId, setGoalId] = useState(params.goalId || activeGoals[0]?.id || '');
  const [kind, setKind] = useState<QuestKind>(params.kind ?? 'habit');
  const [scheduled, setScheduled] = useState<DateTimeParts>({ date: defaultDate, time: '19:00' });
  const [deadline, setDeadline] = useState<DateTimeParts>({ date: defaultDate, time: '20:15' });
  const [duration, setDuration] = useState('45');
  const [priority, setPriority] = useState<Priority>('high');
  const [intensity, setIntensity] = useState<Intensity>('normal');
  const [recurrence, setRecurrence] = useState<RecurrenceDraft>({ frequency: 'weekly', days: ['Mon', 'Wed', 'Fri'], interval: 2 });
  const [proofPolicy, setProofPolicy] = useState<ProofPolicy>('optional');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const scheduledAt = fromDateTimeParts(scheduled);
    const deadlineAt = deadline.date ? fromDateTimeParts(deadline) : undefined;
    if (title.trim().length < 3 || !goalId || Number(duration) < 5 || !scheduledAt) {
      setError('Add a useful title, connected Odyssey, valid schedule, and duration of at least 5 minutes.');
      return;
    }
    if (deadline.date && (!deadlineAt || new Date(deadlineAt) < new Date(scheduledAt))) {
      setError('The deadline must be a valid local date and time after the scheduled start.');
      return;
    }
    if (kind === 'habit' && recurrence.frequency === 'weekly' && recurrence.days.length === 0) {
      setError('Choose at least one day for a weekly habit.');
      return;
    }
    setSaving(true);
    setError(null);
    const quest = await createQuest({
      title: title.trim(),
      description: description.trim(),
      goalId,
      kind,
      scheduledAt,
      deadlineAt: deadlineAt ?? undefined,
      durationMinutes: Number(duration),
      priority,
      plannedIntensity: intensity,
      recurrence: kind === 'habit' ? formatRecurrence(recurrence) : undefined,
      proofPolicy,
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
        <ChoiceGroup label="Connected Odyssey" value={goalId} options={activeGoals.map((goal) => goal.id)} labels={Object.fromEntries(activeGoals.map((goal) => [goal.id, goal.shortTitle]))} onChange={setGoalId} />
        <DateTimeField label="Scheduled start" value={scheduled} onChange={setScheduled} />
        <DateTimeField label="Deadline" value={deadline} onChange={setDeadline} optional />
        <Field label="Duration in minutes" value={duration} onChangeText={setDuration} keyboardType="number-pad" />
        <ChoiceGroup label="Priority" value={priority} options={['low', 'medium', 'high', 'critical'] as const} onChange={setPriority} />
        <ChoiceGroup label="Planned intensity" value={intensity} options={['light', 'normal', 'intense'] as const} onChange={setIntensity} />
        {kind === 'habit' ? <RecurrenceEditor value={recurrence} onChange={setRecurrence} /> : null}
        <ChoiceGroup label="Private photo proof" value={proofPolicy} options={['none', 'optional', 'required'] as const} onChange={setProofPolicy} />
        <Typography variant="micro" color={colors.inkSecondary}>Priority and deadline stay separate. Planned intensity is not overwritten by the effort recorded after completion.</Typography>
        {error ? <Typography variant="micro" color={colors.coralText}>{error}</Typography> : null}
        <Button label="Add quest to the calendar" icon={Plus} onPress={save} loading={saving} />
      </Surface>
    </LivingScreen>
  );
}

const styles = StyleSheet.create({ form: { gap: spacing.lg } });
