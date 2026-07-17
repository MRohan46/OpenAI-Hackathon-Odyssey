import { useLocalSearchParams } from 'expo-router';
import { CalendarCheck, Flame, Image, TriangleAlert } from 'lucide-react-native';
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
import { habitAnalytics } from '../../../src/data/mockData';
import { useApp } from '../../../src/state/AppProvider';
import { colors, spacing } from '../../../src/theme/tokens';

export default function HabitAnalyticsScreen() {
  const { habitId } = useLocalSearchParams<{ habitId: string }>();
  const { quests } = useApp();
  const quest = quests.find((item) => item.id === habitId);
  if (!quest) return <LivingScreen><ScreenHeader back /><EmptyState icon={Flame} title="Habit evidence unavailable" message="This habit has no current analytics record." /></LivingScreen>;
  return (
    <LivingScreen dim={0.24}>
      <ScreenHeader back title={quest.title} eyebrow="Habit analytics" />
      <View style={styles.stats}>
        <StatCard icon={Flame} value={`${habitAnalytics.currentStreak}`} label="Current streak" color={colors.coral} />
        <StatCard icon={CalendarCheck} value={`${habitAnalytics.completed}/${habitAnalytics.scheduled}`} label="Completed" />
        <StatCard icon={TriangleAlert} value={`${habitAnalytics.missed}`} label="Missed" color={colors.coral} />
      </View>
      <Surface padding="large" style={styles.chart}>
        <Typography variant="heading">Planned vs actual effort</Typography>
        <Typography variant="body" color={colors.inkSecondary}>Yellow is planned. Turquoise is what you recorded after the session.</Typography>
        <TideBars data={habitAnalytics.weekly.map((item) => ({ label: item.day, value: item.actual, comparison: item.planned }))} accessibilityLabel="Planned versus actual intensity across this week" />
        <View style={styles.legend}><Chip label="Planned" tone="sun" dot /><Chip label="Actual" tone="water" dot /></View>
      </Surface>
      <Surface tone="ink" padding="large" style={styles.truth}>
        <Typography variant="micro" color={colors.sun}>STREAK TRUTH</Typography>
        <Typography variant="title" color={colors.white}>{habitAnalytics.longestStreak} days</Typography>
        <Typography variant="body" color="rgba(255,255,255,0.72)">Longest habit streak. This is separate from the overall Odyssey streak on Today.</Typography>
      </Surface>
      <Surface padding="large" style={styles.proof}><Image size={22} color={colors.waterDeep} /><View style={styles.copy}><Typography variant="heading">Proof history</Typography><Typography variant="body" color={colors.inkSecondary}>{quest.proofPolicy === 'none' ? 'This habit does not use photo proof.' : 'Proof remains private and belongs to individual completion records.'}</Typography></View></Surface>
    </LivingScreen>
  );
}
const styles = StyleSheet.create({ stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, chart: { gap: spacing.md }, legend: { flexDirection: 'row', gap: spacing.xs }, truth: { gap: spacing.xs }, proof: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }, copy: { flex: 1, gap: 3 } });
