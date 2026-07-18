import { useRouter } from 'expo-router';
import { Compass, Flag, Plus, Shield, Trophy } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '../../src/components/Button';
import { EmptyState } from '../../src/components/EmptyState';
import { LivingScreen } from '../../src/components/LivingScreen';
import { ProgressBar } from '../../src/components/ProgressBar';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { SectionHeader } from '../../src/components/SectionHeader';
import { Surface } from '../../src/components/Surface';
import { Typography } from '../../src/components/Typography';
import { useApp } from '../../src/state/AppProvider';
import { colors, radii, spacing } from '../../src/theme/tokens';
import { formatDate } from '../../src/utils/format';

export default function JourneyScreen() {
  const router = useRouter();
  const { goals } = useApp();
  const active = goals.filter((goal) => goal.status === 'active');
  const completed = goals.filter((goal) => goal.status === 'completed');
  return (
    <LivingScreen dim={0.16} testID="journey-screen">
      <ScreenHeader title="Your Odysseys" eyebrow="Every horizon" showNotifications />
      <View style={styles.hero}>
        <Typography variant="display">{active.length} paths. One captain.</Typography>
        <Typography variant="body" color={colors.inkSecondary}>Each journey keeps its own levels, quests, and boss. Finished shores stay visible as evidence, not erased history.</Typography>
      </View>
      <Button label="Begin another Odyssey" icon={Plus} onPress={() => router.push('/goal/new')} />
      <SectionHeader title="Active shores" description={`${active.length} ${active.length === 1 ? 'journey' : 'journeys'} currently moving`} />
      <View style={styles.stack}>
        {active.length === 0 ? <EmptyState icon={Compass} title="No active shore yet" message="Begin an Odyssey when a destination is worth charting." actionLabel="Begin an Odyssey" onAction={() => router.push('/goal/new')} /> : null}
        {active.map((goal, index) => (
          <Surface key={goal.id} onPress={() => router.push(`/goal/${goal.id}`)} accessibilityLabel={`Open ${goal.shortTitle}`} padding="large" style={styles.goal}>
            <View style={styles.goalTop}>
              <View style={[styles.number, { backgroundColor: goal.accent }]}><Typography variant="label">{index + 1}</Typography></View>
              <View style={styles.goalCopy}><Typography variant="heading">{goal.shortTitle}</Typography><Typography variant="micro" color={colors.inkSecondary}>LEVEL {goal.currentLevel} OF 10 · {goal.progress}% JOURNEY</Typography></View>
              <Compass size={23} color={colors.ink} />
            </View>
            <ProgressBar value={goal.progress} color={goal.accent} accessibilityLabel={`${goal.shortTitle} progress`} />
            <View style={styles.boss}><View style={styles.bossName}><Shield size={16} color={colors.coral} /><Typography variant="micro">{goal.bossName}</Typography></View><Typography variant="micro" color={colors.coralText}>{goal.bossHealth}% health</Typography></View>
          </Surface>
        ))}
      </View>
      <SectionHeader title="Conquered shores" description={`${completed.length} completed ${completed.length === 1 ? 'Odyssey' : 'Odysseys'} preserved`} />
      <View style={styles.stack}>
        {completed.length === 0 ? <EmptyState icon={Trophy} title="No conquered shore yet" message="A completed Odyssey will remain here with its roadmap and evidence." /> : null}
        {completed.map((goal) => (
          <Surface key={goal.id} onPress={() => router.push(`/goal/${goal.id}/victory`)} accessibilityLabel={`Open victory record for ${goal.shortTitle}`} padding="large" style={styles.completed}>
            <Trophy size={26} color={colors.sun} />
            <View style={styles.goalCopy}><Typography variant="heading">{goal.shortTitle}</Typography><Typography variant="body" color={colors.inkSecondary}>Final boss defeated · {goal.completedAt ? formatDate(goal.completedAt) : 'Completed'}</Typography><Typography variant="micro" color={colors.success}>100% roadmap · history preserved</Typography></View>
          </Surface>
        ))}
      </View>
      <Surface tone="ink" padding="large" style={styles.finalCard}><Flag size={25} color={colors.sun} /><Typography variant="heading" color={colors.white}>The goal is not a progress bar.</Typography><Typography variant="body" color="rgba(255,255,255,0.76)">The bar only shows the path. The victory still belongs to the work.</Typography></Surface>
    </LivingScreen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing.xs }, stack: { gap: spacing.md }, goal: { gap: spacing.md },
  goalTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, number: { width: 40, height: 40, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  goalCopy: { flex: 1, gap: 2 }, boss: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, bossName: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  completed: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderColor: colors.sun }, finalCard: { gap: spacing.sm },
});
