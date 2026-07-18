import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2, Flag, History, ShieldCheck, Trophy } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '../../../src/components/Button';
import { EmptyState } from '../../../src/components/EmptyState';
import { LivingScreen } from '../../../src/components/LivingScreen';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { StatCard } from '../../../src/components/StatCard';
import { Surface } from '../../../src/components/Surface';
import { Typography } from '../../../src/components/Typography';
import { useApp } from '../../../src/state/AppProvider';
import { colors, spacing } from '../../../src/theme/tokens';
import { formatQuestDate } from '../../../src/utils/format';

export default function VictoryScreen() {
  const { goalId } = useLocalSearchParams<{ goalId: string }>();
  const router = useRouter();
  const { goals, quests } = useApp();
  const goal = goals.find((item) => item.id === goalId && item.status === 'completed');
  if (!goal) return <LivingScreen><ScreenHeader back /><EmptyState icon={Flag} title="Victory record unavailable" message="This Odyssey has not reached a confirmed final victory." /></LivingScreen>;
  const connected = quests.filter((quest) => quest.goalId === goal.id);
  const completed = connected.filter((quest) => quest.status === 'completed');
  return (
    <LivingScreen immersive accent={goal.accent} dim={0.08}>
      <ScreenHeader back title="Victory shore" eyebrow="Completed Odyssey · preserved" />
      <Surface tone="ink" padding="large" style={styles.hero}>
        <Trophy size={44} color={colors.sun} />
        <Typography variant="display" color={colors.white}>{goal.shortTitle}</Typography>
        <Typography variant="body" color="rgba(255,255,255,0.75)">{goal.completedAt ? `Final victory confirmed ${formatQuestDate(goal.completedAt)}` : 'Final victory confirmed'}</Typography>
      </Surface>
      <View style={styles.stats}>
        <StatCard icon={CheckCircle2} value="10/10" label="Levels complete" color={colors.success} />
        <StatCard icon={ShieldCheck} value="0%" label="Boss health" color={colors.coral} />
        <StatCard icon={History} value={String(completed.length)} label="Saved completions" color={colors.water} />
      </View>
      <Surface padding="large" style={styles.note}><Typography variant="micro" color={colors.waterDeep}>CAPTAIN&apos;S NOTE</Typography><Typography variant="title">“{goal.victoryNote ?? 'I kept going until the path became proof.'}”</Typography><Typography variant="body" color={colors.inkSecondary}>Roadmap stages, completed quest history, planned and actual effort, proof references, and earned rewards remain attached to this completed Odyssey.</Typography></Surface>
      <Button label="View preserved analytics" icon={History} variant="secondary" onPress={() => router.push(`/analytics/goal/${goal.id}`)} />
      <Button label="Begin another Odyssey" icon={Flag} onPress={() => router.push('/goal/new')} />
    </LivingScreen>
  );
}

const styles = StyleSheet.create({ hero: { alignItems: 'flex-start', gap: spacing.sm }, stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, note: { gap: spacing.sm } });
