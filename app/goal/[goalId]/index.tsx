import { useLocalSearchParams, useRouter } from 'expo-router';
import { BarChart3, CalendarClock, Pencil, Shield } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '../../../src/components/Button';
import { Chip } from '../../../src/components/Chip';
import { EmptyState } from '../../../src/components/EmptyState';
import { LivingScreen } from '../../../src/components/LivingScreen';
import { ProgressBar } from '../../../src/components/ProgressBar';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { Surface } from '../../../src/components/Surface';
import { Typography } from '../../../src/components/Typography';
import { useApp } from '../../../src/state/AppProvider';
import { colors, radii, spacing } from '../../../src/theme/tokens';
import { formatDate } from '../../../src/utils/format';

export default function GoalDetailScreen() {
  const { goalId } = useLocalSearchParams<{ goalId: string }>();
  const router = useRouter();
  const { goals, quests } = useApp();
  const goal = goals.find((item) => item.id === goalId);
  if (!goal) return <LivingScreen dim={0.2}><ScreenHeader back /><EmptyState icon={Shield} title="This Odyssey is beyond the map." message="It may have been archived or the link is no longer current." onAction={() => router.replace('/(tabs)/journey')} actionLabel="Return to journeys" /></LivingScreen>;
  const connected = quests.filter((quest) => quest.goalId === goal.id);
  return (
    <LivingScreen immersive accent={goal.accent} dim={0.1}>
      <ScreenHeader back eyebrow={`Level ${goal.currentLevel} of 10`} />
      <View style={styles.hero}>
        <Typography variant="display">{goal.shortTitle}</Typography>
        <Typography variant="body" color={colors.inkSecondary}>{goal.description}</Typography>
        <View style={styles.chips}><Chip label={`${goal.progress}% journey`} tone="water" /><Chip label={`Due ${formatDate(`${goal.deadline}T12:00:00`)}`} tone="sun" /></View>
      </View>
      <Surface tone="ink" padding="large" style={styles.boss}>
        <View style={styles.bossTop}><View><Typography variant="micro" color={colors.coral}>ACTIVE BOSS</Typography><Typography variant="title" color={colors.white}>{goal.bossName}</Typography></View><Shield size={34} color={colors.coral} /></View>
        <ProgressBar value={goal.bossHealth} color={colors.coral} trackColor="rgba(255,255,255,0.18)" accessibilityLabel={`${goal.bossName} health`} />
        <Typography variant="micro" color="rgba(255,255,255,0.72)">{goal.bossHealth}% health remains · only confirmed connected quests deal damage</Typography>
      </Surface>
      <View style={styles.actions}>
        <Button label="Goal analytics" icon={BarChart3} variant="secondary" compact onPress={() => router.push(`/analytics/goal/${goal.id}`)} />
        <Button label="Edit goal" icon={Pencil} variant="secondary" compact onPress={() => router.push(`/goal/${goal.id}/edit`)} />
      </View>
      <Typography variant="heading">The ten-level route</Typography>
      <View style={styles.path}>
        {goal.roadmap.map((level) => (
          <Surface key={level.id} onPress={() => router.push(`/roadmap/level/${level.id}`)} accessibilityLabel={`Open level ${level.number}, ${level.title}`} padding="medium" style={[styles.level, level.status === 'active' && styles.activeLevel]}>
            <View style={[styles.levelDot, { backgroundColor: level.status === 'completed' ? colors.success : level.status === 'active' ? goal.accent : colors.sandStrong }]}>{level.bossType !== 'none' ? <Shield size={15} color={colors.ink} /> : <Typography variant="micro">{level.number}</Typography>}</View>
            <View style={styles.levelCopy}><Typography variant="label">{level.title}</Typography><Typography variant="micro" color={colors.inkSecondary}>{level.status.toUpperCase()} · {level.bossType === 'none' ? 'STAGE' : level.bossType === 'mini' ? 'MINI-BOSS' : 'FINAL BOSS'}</Typography></View>
          </Surface>
        ))}
      </View>
      <Surface padding="large" style={styles.connected}><CalendarClock size={22} color={colors.waterDeep} /><View style={styles.levelCopy}><Typography variant="heading">{connected.length} connected quests</Typography><Typography variant="body" color={colors.inkSecondary}>Scheduled occurrences stay separate from the roadmap stage they support.</Typography></View></Surface>
    </LivingScreen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing.sm }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  boss: { gap: spacing.sm }, bossTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, path: { gap: spacing.xs },
  level: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, activeLevel: { borderColor: colors.sun, borderWidth: 2 },
  levelDot: { width: 38, height: 38, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' }, levelCopy: { flex: 1, gap: 2 },
  connected: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
