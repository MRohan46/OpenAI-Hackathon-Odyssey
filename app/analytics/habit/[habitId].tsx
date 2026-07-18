import { useLocalSearchParams } from 'expo-router';
import { CalendarCheck, Flame, History, Image, TriangleAlert } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Chip } from '../../../src/components/Chip';
import { EmptyState } from '../../../src/components/EmptyState';
import { LivingScreen } from '../../../src/components/LivingScreen';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { StatCard } from '../../../src/components/StatCard';
import { Surface } from '../../../src/components/Surface';
import { TideBars } from '../../../src/components/TideBars';
import { Typography } from '../../../src/components/Typography';
import { useApp } from '../../../src/state/AppProvider';
import { colors, spacing } from '../../../src/theme/tokens';
import { buildHabitAnalytics } from '../../../src/utils/analytics';
import { formatQuestDate, statusLabel, titleCase } from '../../../src/utils/format';

export default function HabitAnalyticsScreen() {
  const { habitId } = useLocalSearchParams<{ habitId: string }>();
  const { quests } = useApp();
  const quest = quests.find((item) => item.id === habitId);
  if (!quest) return <LivingScreen><ScreenHeader back /><EmptyState icon={Flame} title="Habit evidence unavailable" message="This habit has no current analytics record." /></LivingScreen>;
  const analytics = buildHabitAnalytics(quest, quests);
  const proofHistory = quests.filter((item) => (item.id === quest.id || (quest.seriesId && item.seriesId === quest.seriesId)) && item.status === 'completed' && item.proofUri);
  const occurrenceHistory = quests.filter((item) => item.id === quest.id || (quest.seriesId && item.seriesId === quest.seriesId)).sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
  return (
    <LivingScreen dim={0.24}>
      <ScreenHeader back title={quest.title} eyebrow="Habit analytics" />
      <View style={styles.stats}>
        <StatCard icon={Flame} value={`${analytics.currentStreak}`} label="Current streak" color={colors.coral} />
        <StatCard icon={CalendarCheck} value={`${analytics.completed}/${analytics.scheduled}`} label="Completed" />
        <StatCard icon={TriangleAlert} value={`${analytics.missed}`} label="Missed" color={colors.coral} />
      </View>
      <Surface padding="large" style={styles.chart}>
        <Typography variant="heading">Planned vs actual effort</Typography>
        <Typography variant="body" color={colors.inkSecondary}>Yellow is planned. Turquoise is what you recorded after the session.</Typography>
        <TideBars data={analytics.weekly.map((item) => ({ label: item.day, value: item.actual, comparison: item.planned }))} accessibilityLabel="Planned versus actual intensity across this week" />
        <View style={styles.legend}><Chip label="Planned" tone="sun" dot /><Chip label="Actual" tone="water" dot /></View>
      </Surface>
      <Surface tone="ink" padding="large" style={styles.truth}>
        <Typography variant="micro" color={colors.sun}>STREAK TRUTH</Typography>
        <Typography variant="title" color={colors.white}>{analytics.longestStreak} days</Typography>
        <Typography variant="body" color="rgba(255,255,255,0.72)">Longest habit streak. This is separate from the overall Odyssey streak on Today.</Typography>
      </Surface>
      <Surface padding="large" style={styles.proof}><Image size={22} color={colors.waterDeep} /><View style={styles.copy}><Typography variant="heading">Proof history</Typography><Typography variant="body" color={colors.inkSecondary}>{quest.proofPolicy === 'none' ? 'This habit does not use photo proof.' : `${proofHistory.length} private proof ${proofHistory.length === 1 ? 'record' : 'records'} attached to confirmed completions.`}</Typography>{proofHistory.map((item) => <View key={item.id} style={styles.proofRow}><Typography variant="label">{formatQuestDate(item.completedAt ?? item.scheduledAt)}</Typography><Chip label={`${titleCase(item.actualIntensity ?? item.plannedIntensity)} effort`} tone="water" /><Typography variant="micro" color={colors.inkSecondary}>Private reference · owner only</Typography></View>)}</View></Surface>
      <Surface padding="large" style={styles.proof}><History size={22} color={colors.waterDeep} /><View style={styles.copy}><Typography variant="heading">Occurrence history</Typography><Typography variant="body" color={colors.inkSecondary}>Scheduled, completed, and missed occurrences remain separate records.</Typography>{occurrenceHistory.map((item) => <View key={item.id} style={styles.historyRow}><View style={styles.historyTop}><Typography variant="label">{formatQuestDate(item.scheduledAt)}</Typography><View style={styles.historyTop}><Chip label={statusLabel[item.status]} tone={item.status === 'completed' ? 'success' : item.status === 'missed' || item.status === 'overdue' ? 'coral' : 'water'} />{item.streakProtected ? <Chip label="Streak protected" tone="sun" /> : null}</View></View><Typography variant="micro" color={colors.inkSecondary}>{titleCase(item.plannedIntensity)} planned{item.actualIntensity ? ` · ${titleCase(item.actualIntensity)} actual` : ''}</Typography></View>)}</View></Surface>
    </LivingScreen>
  );
}
const styles = StyleSheet.create({ stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, chart: { gap: spacing.md }, legend: { flexDirection: 'row', gap: spacing.xs }, truth: { gap: spacing.xs }, proof: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }, copy: { flex: 1, gap: spacing.sm }, proofRow: { gap: spacing.xs, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.sm }, historyRow: { gap: spacing.xs, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.sm }, historyTop: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs } });
