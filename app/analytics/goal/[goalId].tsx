import { useLocalSearchParams } from 'expo-router';
import { CalendarClock, CheckCircle2, Flag, Shield } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '../../../src/components/EmptyState';
import { LivingScreen } from '../../../src/components/LivingScreen';
import { ProgressBar } from '../../../src/components/ProgressBar';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { StatCard } from '../../../src/components/StatCard';
import { Surface } from '../../../src/components/Surface';
import { Typography } from '../../../src/components/Typography';
import { goalAnalytics } from '../../../src/data/mockData';
import { useApp } from '../../../src/state/AppProvider';
import { colors, spacing } from '../../../src/theme/tokens';

export default function GoalAnalyticsScreen() {
  const { goalId } = useLocalSearchParams<{ goalId: string }>();
  const { goals } = useApp();
  const goal = goals.find((item) => item.id === goalId);
  if (!goal) return <LivingScreen><ScreenHeader back /><EmptyState icon={Flag} title="Goal evidence unavailable" message="This goal has no current analytics record." /></LivingScreen>;
  const rows = [
    { label: 'Roadmap progress', value: goal.progress, color: colors.water, note: 'Accepted levels and milestones' },
    { label: 'Connected quest completion', value: goalAnalytics.connectedQuestCompletion, color: colors.success, note: 'Confirmed connected occurrences' },
    { label: 'Deadline elapsed', value: goalAnalytics.deadlineProgress, color: colors.sun, note: 'Time used, not progress earned' },
    { label: 'Boss health remaining', value: goal.bossHealth, color: colors.coral, note: 'Remaining health, not journey completion' },
  ];
  return (
    <LivingScreen immersive accent={goal.accent} dim={0.12}>
      <ScreenHeader back title={goal.shortTitle} eyebrow="Goal analytics" />
      <View style={styles.stats}>
        <StatCard icon={Flag} value={`${goal.currentLevel}/10`} label="Roadmap level" />
        <StatCard icon={CheckCircle2} value={`${goalAnalytics.completedStages}`} label="Stages complete" color={colors.success} />
        <StatCard icon={Shield} value={`${goal.bossHealth}%`} label="Boss health" color={colors.coral} />
      </View>
      <Surface padding="large" style={styles.progress}>
        <Typography variant="heading">Four different signals</Typography>
        <Typography variant="body" color={colors.inkSecondary}>They relate to the same goal, but they do not mean the same thing.</Typography>
        {rows.map((row) => <View key={row.label} style={styles.row}><View style={styles.rowTitle}><Typography variant="label">{row.label}</Typography><Typography variant="label">{row.value}%</Typography></View><ProgressBar value={row.value} color={row.color} accessibilityLabel={`${row.label}: ${row.value} percent`} /><Typography variant="micro" color={colors.inkSecondary}>{row.note}</Typography></View>)}
      </Surface>
      <Surface tone="ink" padding="large" style={styles.deadline}>
        <CalendarClock size={26} color={colors.sun} />
        <View style={styles.copy}><Typography variant="heading" color={colors.white}>Deadline context</Typography><Typography variant="body" color="rgba(255,255,255,0.72)">31% of the available time has passed while 42% of the roadmap is confirmed. That is context—not a moral score.</Typography></View>
      </Surface>
    </LivingScreen>
  );
}
const styles = StyleSheet.create({ stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, progress: { gap: spacing.lg }, row: { gap: spacing.xs }, rowTitle: { flexDirection: 'row', justifyContent: 'space-between' }, deadline: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }, copy: { flex: 1, gap: 3 } });
