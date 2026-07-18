import { useLocalSearchParams, useRouter } from 'expo-router';
import { Save } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Button } from '../../../src/components/Button';
import { ChoiceGroup } from '../../../src/components/ChoiceGroup';
import { DateTimeField } from '../../../src/components/DateTimeField';
import { EmptyState } from '../../../src/components/EmptyState';
import { Field } from '../../../src/components/Field';
import { LivingScreen } from '../../../src/components/LivingScreen';
import { RecurrenceEditor } from '../../../src/components/RecurrenceEditor';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { Surface } from '../../../src/components/Surface';
import { Typography } from '../../../src/components/Typography';
import { useApp } from '../../../src/state/AppProvider';
import type { Intensity, Priority, ProofPolicy } from '../../../src/types/domain';
import { colors, spacing } from '../../../src/theme/tokens';
import { formatRecurrence, fromDateTimeParts, parseRecurrence, toDateTimeParts } from '../../../src/utils/scheduling';

export default function EditQuestScreen() {
  const { questId } = useLocalSearchParams<{ questId: string }>();
  const router = useRouter();
  const { quests, goals, updateQuest, updateQuestSeries } = useApp();
  const quest = quests.find((item) => item.id === questId);
  const [title, setTitle] = useState(quest?.title ?? '');
  const [description, setDescription] = useState(quest?.description ?? '');
  const [goalId, setGoalId] = useState(quest?.goalId ?? '');
  const [scheduled, setScheduled] = useState(quest ? toDateTimeParts(quest.scheduledAt) : { date: '', time: '' });
  const [deadline, setDeadline] = useState(quest?.deadlineAt ? toDateTimeParts(quest.deadlineAt) : { date: '', time: '' });
  const [duration, setDuration] = useState(String(quest?.durationMinutes ?? 30));
  const [priority, setPriority] = useState<Priority>(quest?.priority ?? 'medium');
  const [intensity, setIntensity] = useState<Intensity>(quest?.plannedIntensity ?? 'normal');
  const [recurrence, setRecurrence] = useState(parseRecurrence(quest?.recurrence));
  const [proofPolicy, setProofPolicy] = useState<ProofPolicy>(quest?.proofPolicy ?? 'none');
  const [scope, setScope] = useState<'occurrence' | 'series'>('occurrence');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeGoals = goals.filter((goal) => goal.status === 'active');

  if (!quest) return <LivingScreen><ScreenHeader back /><EmptyState icon={Save} title="Quest unavailable" message="This quest can no longer be edited." /></LivingScreen>;

  const save = async () => {
    const scheduledAt = fromDateTimeParts(scheduled);
    const deadlineAt = deadline.date ? fromDateTimeParts(deadline) : undefined;
    if (!scheduledAt || title.trim().length < 3 || Number(duration) < 5) {
      setError('Use a valid title, local schedule, and duration of at least 5 minutes.');
      return;
    }
    if (deadline.date && (!deadlineAt || new Date(deadlineAt) < new Date(scheduledAt))) {
      setError('The deadline must be after the scheduled start.');
      return;
    }
    setSaving(true);
    const updater = scope === 'series' ? updateQuestSeries : updateQuest;
    const result = await updater(quest.id, {
      title: title.trim(),
      description: description.trim(),
      goalId,
      scheduledAt,
      deadlineAt: deadlineAt ?? undefined,
      durationMinutes: Number(duration),
      priority,
      plannedIntensity: intensity,
      recurrence: quest.kind === 'habit' ? formatRecurrence(recurrence) : undefined,
      proofPolicy,
      status: quest.status === 'overdue' || quest.status === 'missed' ? 'scheduled' : quest.status,
    });
    setSaving(false);
    if (result) setError(result);
    else router.replace(`/quest/${quest.id}`);
  };

  return (
    <LivingScreen dim={0.25}>
      <ScreenHeader back title="Edit quest" eyebrow={quest.kind === 'habit' ? 'Habit schedule and occurrence' : 'One-time task'} />
      <Surface padding="large" style={styles.form}>
        {quest.kind === 'habit' ? <ChoiceGroup label="Edit scope" value={scope} options={['occurrence', 'series'] as const} labels={{ occurrence: 'This occurrence', series: 'Future schedule' }} onChange={setScope} /> : null}
        <Typography variant="micro" color={colors.inkSecondary}>{scope === 'series' ? 'Every loaded future occurrence in this habit series changes together. Completed and missed history remains untouched.' : 'Only this scheduled occurrence changes; completed history remains untouched.'}</Typography>
        <Field label="Quest title" value={title} onChangeText={setTitle} />
        <Field label="Useful description" value={description} onChangeText={setDescription} multiline />
        <ChoiceGroup label="Connected Odyssey" value={goalId} options={activeGoals.map((goal) => goal.id)} labels={Object.fromEntries(activeGoals.map((goal) => [goal.id, goal.shortTitle]))} onChange={setGoalId} />
        <DateTimeField label="Scheduled start" value={scheduled} onChange={setScheduled} />
        <DateTimeField label="Deadline" value={deadline} onChange={setDeadline} optional />
        <Field label="Duration in minutes" value={duration} onChangeText={setDuration} keyboardType="number-pad" />
        <ChoiceGroup label="Priority" value={priority} options={['low', 'medium', 'high', 'critical'] as const} onChange={setPriority} />
        <ChoiceGroup label="Planned intensity" value={intensity} options={['light', 'normal', 'intense'] as const} onChange={setIntensity} />
        {quest.kind === 'habit' ? <RecurrenceEditor value={recurrence} onChange={setRecurrence} /> : null}
        <ChoiceGroup label="Private photo proof" value={proofPolicy} options={['none', 'optional', 'required'] as const} onChange={setProofPolicy} />
        {error ? <Typography variant="micro" color={colors.coralText}>{error}</Typography> : null}
        <Button label="Save quest changes" icon={Save} onPress={save} loading={saving} />
      </Surface>
    </LivingScreen>
  );
}

const styles = StyleSheet.create({ form: { gap: spacing.lg } });
