import { useRouter } from 'expo-router';
import { CheckCircle2, Flame, Gem, Target, Waves } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '../src/components/Button';
import { Chip } from '../src/components/Chip';
import { EmptyState } from '../src/components/EmptyState';
import { LivingScreen } from '../src/components/LivingScreen';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { SectionHeader } from '../src/components/SectionHeader';
import { StatCard } from '../src/components/StatCard';
import { Surface } from '../src/components/Surface';
import { TideBars } from '../src/components/TideBars';
import { Typography } from '../src/components/Typography';
import { useApp } from '../src/state/AppProvider';
import { colors, spacing } from '../src/theme/tokens';
import { buildOverallAnalytics } from '../src/utils/analytics';

export default function AnalyticsScreen() {
  const router = useRouter();
  const { goals, quests } = useApp();
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [openedAt] = useState(() => new Date());
  const referenceDate = useMemo(() => new Date(Math.max(...quests.map((quest) => new Date(quest.scheduledAt).getTime()), openedAt.getTime())), [openedAt, quests]);
  const analytics = useMemo(() => buildOverallAnalytics(quests, period, referenceDate), [period, quests, referenceDate]);
  const habits = useMemo(() => quests.filter((quest, index, all) => quest.kind === 'habit' && all.findIndex((candidate) => candidate.seriesId ? candidate.seriesId === quest.seriesId : candidate.id === quest.id) === index), [quests]);
  if (quests.length === 0) return <LivingScreen dim={0.24}><ScreenHeader back title="Progress" eyebrow="Evidence, not pressure" /><EmptyState icon={Waves} title="No evidence yet" message="Completed and missed quest occurrences will build honest analytics here." /></LivingScreen>;
  return (
    <LivingScreen dim={0.24}>
      <ScreenHeader back title="Progress" eyebrow="Evidence, not pressure" />
      <View style={styles.period}><Chip label="This week" selected={period === 'week'} tone="water" onPress={() => setPeriod('week')} /><Chip label="This month" selected={period === 'month'} tone="water" onPress={() => setPeriod('month')} /></View>
      <View style={styles.stats}>
        <StatCard icon={CheckCircle2} value={`${analytics.completionRate}%`} label="Completion" />
        <StatCard icon={Waves} value={`${analytics.consistency}%`} label="Consistency" color={colors.water} />
        <StatCard icon={Flame} value={analytics.xpEarned.toString()} label="XP earned" color={colors.coral} />
      </View>
      <Surface padding="large" style={styles.chart}>
        <SectionHeader title="Quest rhythm" description={`${period === 'week' ? 'Confirmed completion by day' : 'Weekly average across this month'}`} />
        <TideBars data={analytics.daily} accessibilityLabel={`${period} quest completion: ${analytics.daily.map((item) => `${item.label} ${item.value} percent`).join(', ')}`} />
      </Surface>
      <Surface tone="ink" padding="large" style={styles.intensity}>
        <Typography variant="micro" color={colors.sun}>ACTUAL INTENSITY MIX</Typography>
        <View style={styles.intensityRow}><View><Typography variant="title" color={colors.white}>{analytics.intensity.light}</Typography><Typography variant="micro" color="rgba(255,255,255,0.65)">Light</Typography></View><View><Typography variant="title" color={colors.white}>{analytics.intensity.normal}</Typography><Typography variant="micro" color="rgba(255,255,255,0.65)">Normal</Typography></View><View><Typography variant="title" color={colors.white}>{analytics.intensity.intense}</Typography><Typography variant="micro" color="rgba(255,255,255,0.65)">Intense</Typography></View></View>
        <Typography variant="micro" color="rgba(255,255,255,0.7)">This reflects recorded effort after completion. It does not overwrite what was planned.</Typography>
      </Surface>
      <SectionHeader title="Explore the evidence" />
      {habits.map((habit) => <Button key={habit.id} label={`${habit.title} · streak and misses`} icon={Flame} variant="secondary" onPress={() => router.push(`/analytics/habit/${habit.id}`)} />)}
      {goals.map((goal) => <Button key={goal.id} label={`${goal.shortTitle} progress`} icon={Target} variant="secondary" onPress={() => router.push(`/analytics/goal/${goal.id}`)} />)}
      <View style={styles.rubyLine}><Gem size={18} color={colors.waterDeep} /><Typography variant="label">{analytics.rubiesEarned} rubies earned in confirmed {period} completions</Typography></View>
    </LivingScreen>
  );
}
const styles = StyleSheet.create({
  period: { flexDirection: 'row', gap: spacing.xs }, stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, chart: { gap: spacing.md }, intensity: { gap: spacing.md }, intensityRow: { flexDirection: 'row', justifyContent: 'space-around' }, rubyLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
