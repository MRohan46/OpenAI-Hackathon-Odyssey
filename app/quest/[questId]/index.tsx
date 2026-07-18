import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertTriangle, BarChart3, CalendarClock, Camera, Check, Clock3, Flame, Pencil, RefreshCcw, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Button } from '../../../src/components/Button';
import { Chip } from '../../../src/components/Chip';
import { EmptyState } from '../../../src/components/EmptyState';
import { LivingScreen } from '../../../src/components/LivingScreen';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { Surface } from '../../../src/components/Surface';
import { Typography } from '../../../src/components/Typography';
import { useApp } from '../../../src/state/AppProvider';
import { colors, spacing } from '../../../src/theme/tokens';
import { formatQuestDate, statusLabel, titleCase } from '../../../src/utils/format';

export default function QuestDetailScreen() {
  const { questId } = useLocalSearchParams<{ questId: string }>();
  const router = useRouter();
  const { quests, goals, updateQuest, removeQuest } = useApp();
  const quest = quests.find((item) => item.id === questId);
  const goal = goals.find((item) => item.id === quest?.goalId);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!quest) return <LivingScreen><ScreenHeader back /><EmptyState icon={AlertTriangle} title="Quest unavailable" message="This occurrence may have been removed or the link is no longer current." actionLabel="Return to Today" onAction={() => router.replace('/(tabs)/today')} /></LivingScreen>;

  const reschedule = async () => {
    setPending(true);
    const newDate = new Date(quest.scheduledAt);
    newDate.setHours(newDate.getHours() + 2);
    const result = await updateQuest(quest.id, { scheduledAt: newDate.toISOString(), status: 'scheduled' });
    setPending(false);
    setError(result);
  };
  const remove = () => Alert.alert('Remove this quest?', 'Only this quest record is removed. Completed progress is never silently reversed.', [
    { text: 'Keep quest', style: 'cancel' },
    { text: 'Remove', style: 'destructive', onPress: async () => { const result = await removeQuest(quest.id); if (result) setError(result); else router.replace('/(tabs)/today'); } },
  ]);

  return (
    <LivingScreen immersive accent={goal?.accent} dim={0.11}>
      <ScreenHeader back eyebrow={`${quest.kind === 'habit' ? 'Habit occurrence' : 'One-time task'} · ${statusLabel[quest.status]}`} />
      <View style={styles.hero}>
        <View style={styles.chips}><Chip label={statusLabel[quest.status]} tone={quest.status === 'completed' ? 'success' : quest.status === 'overdue' || quest.status === 'missed' ? 'coral' : 'water'} dot /><Chip label={`${titleCase(quest.priority)} priority`} tone={quest.priority === 'high' || quest.priority === 'critical' ? 'coral' : 'default'} /></View>
        <Typography variant="display">{quest.title}</Typography>
        <Typography variant="body" color={colors.inkSecondary}>{quest.description}</Typography>
      </View>
      <Surface padding="large" style={styles.details}>
        <View style={styles.detail}><CalendarClock size={19} color={colors.waterDeep} /><View><Typography variant="micro" color={colors.inkSecondary}>SCHEDULED</Typography><Typography variant="label">{formatQuestDate(quest.scheduledAt)}</Typography></View></View>
        <View style={styles.detail}><Clock3 size={19} color={colors.waterDeep} /><View><Typography variant="micro" color={colors.inkSecondary}>SESSION</Typography><Typography variant="label">{quest.durationMinutes} minutes · {titleCase(quest.plannedIntensity)} planned</Typography></View></View>
        <View style={styles.detail}><Camera size={19} color={colors.waterDeep} /><View><Typography variant="micro" color={colors.inkSecondary}>PRIVATE PROOF</Typography><Typography variant="label">{titleCase(quest.proofPolicy)}</Typography></View></View>
        {quest.actualIntensity ? <View style={styles.detail}><Check size={19} color={colors.success} /><View><Typography variant="micro" color={colors.inkSecondary}>ACTUAL EFFORT</Typography><Typography variant="label">{titleCase(quest.actualIntensity)} · recorded after completion</Typography></View></View> : null}
      </Surface>
      <Surface tone="ink" padding="large" style={styles.rewards}>
        <View><Typography variant="micro" color={colors.sun}>CONFIRMED REWARD ON COMPLETION</Typography><Typography variant="heading" color={colors.white}>{quest.rewardXp} XP · {quest.rewardRubies} rubies</Typography></View>
        <View style={styles.damage}><Flame size={19} color={colors.coral} /><Typography variant="label" color={colors.white}>{quest.bossDamage} boss damage</Typography></View>
      </Surface>
      {quest.status === 'missed' || quest.status === 'overdue' ? <Surface padding="large" style={styles.recovery}><AlertTriangle size={22} color={colors.coralText} /><View style={styles.recoveryCopy}><Typography variant="heading">Choose the recovery, keep the truth.</Typography><Typography variant="body" color={colors.inkSecondary}>Reschedule the work, complete it honestly, or reserve an eligible streak guard. Existing XP, roadmap stages, and boss damage are never reversed.</Typography><View style={styles.actions}><Button label="Choose a new time" icon={CalendarClock} variant="secondary" compact onPress={() => router.push(`/quest/${quest.id}/edit`)} /><Button label="Streak protection" icon={RefreshCcw} variant="ghost" compact onPress={() => router.push('/rewards')} /></View></View></Surface> : null}
      {quest.status !== 'completed' ? <Button label={quest.status === 'completionPending' ? 'Waiting for confirmation' : 'Complete this quest'} icon={Check} disabled={quest.status === 'completionPending'} onPress={() => router.push(`/quest/${quest.id}/complete`)} /> : <Button label="View habit analytics" icon={BarChart3} onPress={() => router.push(`/analytics/habit/${quest.id}`)} />}
      <View style={styles.actions}>
        <Button label="Edit or reschedule" icon={Pencil} variant="secondary" compact onPress={() => router.push(`/quest/${quest.id}/edit`)} />
        <Button label="Quick move +2h" icon={RefreshCcw} variant="secondary" compact loading={pending} onPress={reschedule} />
        <Button label="Remove quest" icon={Trash2} variant="ghost" compact onPress={remove} />
      </View>
      {error ? <Typography variant="micro" color={colors.coralText}>{error}</Typography> : null}
    </LivingScreen>
  );
}
const styles = StyleSheet.create({
  hero: { gap: spacing.sm }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }, details: { gap: spacing.md },
  detail: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, rewards: { gap: spacing.md }, damage: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  recovery: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }, recoveryCopy: { flex: 1, gap: spacing.sm },
});
