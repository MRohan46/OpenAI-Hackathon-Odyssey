import { useRouter } from 'expo-router';
import { CheckCircle2, Flame, Gem, Target, Waves } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '../src/components/Button';
import { Chip } from '../src/components/Chip';
import { LivingScreen } from '../src/components/LivingScreen';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { SectionHeader } from '../src/components/SectionHeader';
import { StatCard } from '../src/components/StatCard';
import { Surface } from '../src/components/Surface';
import { TideBars } from '../src/components/TideBars';
import { Typography } from '../src/components/Typography';
import { overallAnalytics } from '../src/data/mockData';
import { useApp } from '../src/state/AppProvider';
import { colors, spacing } from '../src/theme/tokens';

export default function AnalyticsScreen() {
  const router = useRouter();
  const { goals, quests } = useApp();
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const activeHabit = quests.find((quest) => quest.kind === 'habit');
  return (
    <LivingScreen dim={0.24}>
      <ScreenHeader back title="Progress" eyebrow="Evidence, not pressure" />
      <View style={styles.period}><Chip label="This week" selected={period === 'week'} tone="water" onPress={() => setPeriod('week')} /><Chip label="This month" selected={period === 'month'} tone="water" onPress={() => setPeriod('month')} /></View>
      <View style={styles.stats}>
        <StatCard icon={CheckCircle2} value={`${overallAnalytics.completionRate}%`} label="Completion" />
        <StatCard icon={Waves} value={`${overallAnalytics.consistency}%`} label="Consistency" color={colors.water} />
        <StatCard icon={Flame} value={overallAnalytics.xpEarned.toString()} label="XP earned" color={colors.coral} />
      </View>
      <Surface padding="large" style={styles.chart}>
        <SectionHeader title="Quest rhythm" description={`${period === 'week' ? 'Confirmed completion by day' : 'Weekly average across this month'}`} />
        <TideBars data={overallAnalytics.daily} accessibilityLabel="Daily quest completion: Monday 78, Tuesday 92, Wednesday 84, Thursday 100, Friday 72, weekend zero so far" />
      </Surface>
      <Surface tone="ink" padding="large" style={styles.intensity}>
        <Typography variant="micro" color={colors.sun}>ACTUAL INTENSITY MIX</Typography>
        <View style={styles.intensityRow}><View><Typography variant="title" color={colors.white}>{overallAnalytics.intensity.light}</Typography><Typography variant="micro" color="rgba(255,255,255,0.65)">Light</Typography></View><View><Typography variant="title" color={colors.white}>{overallAnalytics.intensity.normal}</Typography><Typography variant="micro" color="rgba(255,255,255,0.65)">Normal</Typography></View><View><Typography variant="title" color={colors.white}>{overallAnalytics.intensity.intense}</Typography><Typography variant="micro" color="rgba(255,255,255,0.65)">Intense</Typography></View></View>
        <Typography variant="micro" color="rgba(255,255,255,0.7)">This reflects recorded effort after completion. It does not overwrite what was planned.</Typography>
      </Surface>
      <SectionHeader title="Explore the evidence" />
      {activeHabit ? <Button label="Habit streak and misses" icon={Flame} variant="secondary" onPress={() => router.push(`/analytics/habit/${activeHabit.id}`)} /> : null}
      {goals[0] ? <Button label={`${goals[0].shortTitle} progress`} icon={Target} variant="secondary" onPress={() => router.push(`/analytics/goal/${goals[0].id}`)} /> : null}
      <View style={styles.rubyLine}><Gem size={18} color={colors.waterDeep} /><Typography variant="label">{overallAnalytics.rubiesEarned} rubies earned in confirmed completions</Typography></View>
    </LivingScreen>
  );
}
const styles = StyleSheet.create({
  period: { flexDirection: 'row', gap: spacing.xs }, stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, chart: { gap: spacing.md }, intensity: { gap: spacing.md }, intensityRow: { flexDirection: 'row', justifyContent: 'space-around' }, rubyLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
