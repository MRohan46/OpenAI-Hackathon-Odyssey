import { useRouter } from 'expo-router';
import { Flame, Gem, Plus, Shield, Sparkles } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { LivingScreen } from '../components/LivingScreen';
import { ProgressBar } from '../components/ProgressBar';
import { QuestCard } from '../components/QuestCard';
import { ScreenHeader } from '../components/ScreenHeader';
import { Surface } from '../components/Surface';
import { Typography } from '../components/Typography';
import { useApp } from '../state/AppProvider';
import { colors, radii, spacing } from '../theme/tokens';

const statusRank = {
  overdue: 0,
  scheduled: 1,
  inProgress: 1,
  completionPending: 1,
  upcoming: 2,
  completed: 3,
  missed: 4,
} as const;

/**
 * Preserved production Today screen from before the Tide Observatory promotion.
 * It remains compilable so reverting the route is a one-line import/export change.
 */
export function LegacyTodayScreen() {
  const router = useRouter();
  const { profile, goals, quests, rewards } = useApp();
  const activeGoal = goals[0];
  const ordered = useMemo(
    () => [...quests].sort((a, b) => statusRank[a.status] - statusRank[b.status]),
    [quests],
  );
  const featured = ordered.find((quest) => quest.status === 'scheduled' || quest.status === 'inProgress') ?? ordered[0];
  const remaining = ordered.filter((quest) => quest.id !== featured?.id);

  return (
    <LivingScreen immersive dim={0.02} testID="legacy-today-screen">
      <ScreenHeader eyebrow="Friday, 17 July" showNotifications />
      <View style={styles.topline}>
        <Chip label={`${profile.overallStreak} day streak`} tone="sun" dot />
        <View style={styles.wallet}>
          <Gem size={15} color={colors.waterDeep} />
          <Typography variant="micro">{rewards.rubies}</Typography>
        </View>
      </View>
      <View style={styles.headline}>
        <Typography variant="display">One clear step.</Typography>
      </View>
      <Surface padding="small" style={styles.bossGlass}>
        <View style={styles.bossHeader}>
          <View style={styles.bossTitle}>
            <Shield size={18} color={colors.coral} />
            <Typography variant="label">{activeGoal.bossName}</Typography>
          </View>
          <Typography variant="label">{activeGoal.bossHealth}% health</Typography>
        </View>
        <ProgressBar
          value={activeGoal.bossHealth}
          color={colors.coral}
          accessibilityLabel={`${activeGoal.bossName} health`}
        />
        <View style={styles.levelRow}>
          <Typography variant="micro" color={colors.inkSecondary}>
            ROADMAP LEVEL {activeGoal.currentLevel} OF 10
          </Typography>
          <Typography variant="micro" color={colors.inkSecondary}>
            {activeGoal.progress}% journey
          </Typography>
        </View>
      </Surface>
      <View style={styles.worldBreath} accessibilityElementsHidden />
      {featured ? (
        <View style={styles.questSection}>
          <View style={styles.sectionTitle}>
            <Sparkles size={19} color={colors.sun} />
            <Typography variant="label">NEXT STRIKE</Typography>
          </View>
          <QuestCard featured quest={featured} onPress={() => router.push(`/quest/${featured.id}`)} />
          {featured.status !== 'completed' ? (
            <Button
              label="Begin quest"
              icon={Flame}
              onPress={() => router.push(`/quest/${featured.id}/complete`)}
            />
          ) : null}
        </View>
      ) : null}
      <View style={styles.questSection}>
        <View style={styles.rowBetween}>
          <Typography variant="heading">Along the path</Typography>
          <Button
            label="New quest"
            icon={Plus}
            variant="secondary"
            compact
            onPress={() => router.push('/quest/new')}
          />
        </View>
        {remaining.map((quest) => (
          <QuestCard key={quest.id} quest={quest} onPress={() => router.push(`/quest/${quest.id}`)} />
        ))}
      </View>
    </LivingScreen>
  );
}

const styles = StyleSheet.create({
  topline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wallet: {
    minHeight: 34,
    borderRadius: radii.pill,
    backgroundColor: colors.mistStrong,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  headline: { gap: spacing.xs },
  bossGlass: { gap: spacing.sm },
  bossHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  bossTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  worldBreath: { height: 58 },
  questSection: { gap: spacing.md },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
});
