import { useRouter } from 'expo-router';
import { Compass, Flag, Plus, Shield } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '../../src/components/Button';
import { LivingScreen } from '../../src/components/LivingScreen';
import { ProgressBar } from '../../src/components/ProgressBar';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { SectionHeader } from '../../src/components/SectionHeader';
import { Surface } from '../../src/components/Surface';
import { Typography } from '../../src/components/Typography';
import { useApp } from '../../src/state/AppProvider';
import { colors, radii, spacing } from '../../src/theme/tokens';

export default function JourneyScreen() {
  const router = useRouter();
  const { goals } = useApp();
  return (
    <LivingScreen dim={0.16} testID="journey-screen">
      <ScreenHeader title="Your Odysseys" eyebrow="Every horizon" showNotifications />
      <View style={styles.hero}>
        <Typography variant="display">Three paths. One captain.</Typography>
        <Typography variant="body" color={colors.inkSecondary}>Each journey keeps its own levels, quests, and boss. Today chooses what rises.</Typography>
      </View>
      <Button label="Begin another Odyssey" icon={Plus} onPress={() => router.push('/goal/new')} />
      <SectionHeader title="Active shores" description={`${goals.length} journeys currently moving`} />
      <View style={styles.stack}>
        {goals.map((goal, index) => (
          <Surface key={goal.id} onPress={() => router.push(`/goal/${goal.id}`)} accessibilityLabel={`Open ${goal.shortTitle}`} padding="large" style={styles.goal}>
            <View style={styles.goalTop}>
              <View style={[styles.number, { backgroundColor: goal.accent }]}><Typography variant="label">{index + 1}</Typography></View>
              <View style={styles.goalCopy}>
                <Typography variant="heading">{goal.shortTitle}</Typography>
                <Typography variant="micro" color={colors.inkSecondary}>LEVEL {goal.currentLevel} OF 10 · {goal.progress}% JOURNEY</Typography>
              </View>
              <Compass size={23} color={colors.ink} />
            </View>
            <ProgressBar value={goal.progress} color={goal.accent} accessibilityLabel={`${goal.shortTitle} progress`} />
            <View style={styles.boss}>
              <View style={styles.bossName}><Shield size={16} color={colors.coral} /><Typography variant="micro">{goal.bossName}</Typography></View>
              <Typography variant="micro" color={colors.coralText}>{goal.bossHealth}% health</Typography>
            </View>
          </Surface>
        ))}
      </View>
      <Surface tone="ink" padding="large" style={styles.finalCard}>
        <Flag size={25} color={colors.sun} />
        <Typography variant="heading" color={colors.white}>The goal is not a progress bar.</Typography>
        <Typography variant="body" color="rgba(255,255,255,0.76)">The bar only shows the path. The victory still belongs to the work.</Typography>
      </Surface>
    </LivingScreen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing.xs },
  stack: { gap: spacing.md },
  goal: { gap: spacing.md },
  goalTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  number: { width: 40, height: 40, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  goalCopy: { flex: 1, gap: 2 },
  boss: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bossName: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  finalCard: { gap: spacing.sm },
});
