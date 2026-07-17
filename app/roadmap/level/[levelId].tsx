import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, Flag, Shield, Swords } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '../../../src/components/Button';
import { Chip } from '../../../src/components/Chip';
import { EmptyState } from '../../../src/components/EmptyState';
import { LivingScreen } from '../../../src/components/LivingScreen';
import { ProgressBar } from '../../../src/components/ProgressBar';
import { QuestCard } from '../../../src/components/QuestCard';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { Surface } from '../../../src/components/Surface';
import { Typography } from '../../../src/components/Typography';
import { useApp } from '../../../src/state/AppProvider';
import { colors, spacing } from '../../../src/theme/tokens';

export default function RoadmapLevelScreen() {
  const { levelId } = useLocalSearchParams<{ levelId: string }>();
  const router = useRouter();
  const { goals, quests } = useApp();
  const goal = goals.find((item) => item.roadmap.some((level) => level.id === levelId));
  const level = goal?.roadmap.find((item) => item.id === levelId);
  if (!goal || !level) return <LivingScreen><ScreenHeader back /><EmptyState icon={Flag} title="Stage unavailable" message="This level is not on the current map." /></LivingScreen>;
  const connected = quests.filter((quest) => quest.goalId === goal.id).slice(0, 2);
  const isBoss = level.bossType !== 'none';
  return (
    <LivingScreen immersive accent={goal.accent} dim={0.1}>
      <ScreenHeader back eyebrow={`${goal.shortTitle} · Level ${level.number}`} />
      <View style={styles.hero}>
        <Chip label={level.bossType === 'final' ? 'Final boss' : level.bossType === 'mini' ? 'Mini-boss' : level.status} tone={isBoss ? 'coral' : 'water'} dot />
        <Typography variant="display">{level.title}</Typography>
        <Typography variant="body" color={colors.inkSecondary}>{level.purpose}</Typography>
      </View>
      {isBoss ? (
        <Surface tone="ink" padding="large" style={styles.boss}>
          <View style={styles.row}><Shield size={28} color={colors.coral} /><View style={styles.copy}><Typography variant="micro" color={colors.coral}>{level.bossType === 'final' ? 'FINAL BOSS' : 'MILESTONE BOSS'}</Typography><Typography variant="heading" color={colors.white}>{level.bossName}</Typography></View></View>
          <ProgressBar value={level.bossHealth ?? goal.bossHealth} color={colors.coral} trackColor="rgba(255,255,255,0.18)" accessibilityLabel="Level boss health" />
        </Surface>
      ) : null}
      <Surface padding="large" style={styles.milestone}>
        <Swords size={23} color={colors.sun} />
        <View style={styles.copy}><Typography variant="heading">Milestone evidence</Typography><Typography variant="body" color={colors.inkSecondary}>{level.milestone}</Typography></View>
      </Surface>
      <View style={styles.columns}>
        <Surface padding="medium" style={styles.list}><Typography variant="micro" color={colors.waterDeep}>SUGGESTED HABITS</Typography>{level.habits.map((habit) => <View key={habit} style={styles.item}><Check size={16} color={colors.success} /><Typography variant="label">{habit}</Typography></View>)}</Surface>
        <Surface padding="medium" style={styles.list}><Typography variant="micro" color={colors.coralText}>ONE-TIME TASKS</Typography>{level.tasks.map((task) => <View key={task} style={styles.item}><Flag size={16} color={colors.coral} /><Typography variant="label">{task}</Typography></View>)}</Surface>
      </View>
      <Typography variant="heading">Connected quests</Typography>
      {connected.map((quest) => <QuestCard key={quest.id} quest={quest} onPress={() => router.push(`/quest/${quest.id}`)} />)}
      <Button label="Schedule a connected quest" onPress={() => router.push('/quest/new')} />
    </LivingScreen>
  );
}
const styles = StyleSheet.create({
  hero: { gap: spacing.sm, alignItems: 'flex-start' }, boss: { gap: spacing.md }, row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, copy: { flex: 1, gap: 2 },
  milestone: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }, columns: { gap: spacing.sm }, list: { gap: spacing.sm }, item: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
