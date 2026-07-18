import { AlertTriangle, Check, Clock3, Flame, LoaderCircle, X } from 'lucide-react-native';
import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import type { Quest } from '../types/domain';
import { titleCase } from '../utils/format';
import { colors, fontFamilies, radii, shadows, spacing } from '../theme/tokens';
import { Button } from './Button';
import { Typography } from './Typography';

interface QuestRoadmapCardProps {
  quest: Quest;
  statusText: string;
  featured?: boolean;
  onPress: () => void;
  onBegin?: () => void;
  reason?: string;
}

const statusColor = {
  scheduled: colors.sun,
  inProgress: colors.water,
  completionPending: colors.sun,
  completed: colors.success,
  upcoming: colors.inkSecondary,
  overdue: colors.coralText,
  missed: colors.coralText,
} as const;

function QuestStateIcon({ quest }: { quest: Quest }) {
  const Icon =
    quest.status === 'completed'
      ? Check
      : quest.status === 'overdue'
        ? AlertTriangle
        : quest.status === 'missed'
          ? X
          : quest.status === 'completionPending'
            ? LoaderCircle
            : quest.status === 'inProgress'
              ? Flame
              : Clock3;

  return (
    <View style={[styles.statusIcon, { backgroundColor: `${statusColor[quest.status]}1F` }]}>
      <Icon size={15} strokeWidth={2.4} color={statusColor[quest.status]} />
    </View>
  );
}

export function QuestRoadmapCard({ quest, statusText, featured = false, onPress, onBegin, reason }: QuestRoadmapCardProps) {
  const proofText = quest.proofPolicy === 'none' ? 'No proof' : `${titleCase(quest.proofPolicy)} proof`;
  const scheduleText =
    quest.recurrence
      ?.replaceAll('Monday', 'Mon')
      .replaceAll('Tuesday', 'Tue')
      .replaceAll('Wednesday', 'Wed')
      .replaceAll('Thursday', 'Thu')
      .replaceAll('Friday', 'Fri')
      .replaceAll('Saturday', 'Sat')
      .replaceAll('Sunday', 'Sun') ?? (quest.kind === 'task' ? 'One-time task' : 'Habit');
  const waiting = quest.status === 'completionPending';
  const effortText = quest.actualIntensity
    ? `${titleCase(quest.plannedIntensity)} → ${titleCase(quest.actualIntensity)}`
    : titleCase(quest.plannedIntensity);

  return (
    <View style={[styles.frame, featured && styles.featuredFrame]} testID={`roadmap-card-${quest.id}`}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={Platform.OS === 'web' ? undefined : `${quest.title}. ${statusText}. ${quest.durationMinutes} minutes. ${titleCase(quest.priority)} priority. ${titleCase(quest.plannedIntensity)} planned.`}
        accessibilityHint="Opens quest details"
        onPress={onPress}
        testID={`roadmap-card-button-${quest.id}`}
        style={({ pressed }) => [styles.card, featured && styles.featuredCard, pressed && styles.pressed]}
      >
        <View style={styles.titleRow}>
          <QuestStateIcon quest={quest} />
          <View style={styles.titleCopy}>
            <Typography variant={featured ? 'heading' : 'label'} style={featured ? styles.featuredTitle : styles.title}>
              {quest.title}
            </Typography>
            <Typography variant="micro" color={quest.status === 'completed' ? colors.success : statusColor[quest.status]}>
              {statusText}
            </Typography>
          </View>
        </View>
        <View style={styles.metadata}>
          <Typography variant="micro" color={colors.inkSecondary}>
            {quest.durationMinutes} min · {titleCase(quest.priority)} · {effortText}
          </Typography>
          <Typography variant="micro" color={colors.inkSecondary}>
            {quest.rewardXp} XP · {quest.rewardRubies} rubies · {quest.bossDamage} damage
          </Typography>
          <Typography variant="micro" color={colors.inkSecondary}>
            {scheduleText} · {proofText}
          </Typography>
        </View>
        {featured && reason ? <Typography variant="micro" color={colors.waterDeep}>Why now · {reason}</Typography> : null}
      </Pressable>
      {onBegin ? (
        <Button
          label={waiting ? 'Waiting for confirmation' : quest.status === 'inProgress' ? 'Continue quest' : 'Begin quest'}
          icon={waiting ? LoaderCircle : Flame}
          compact
          disabled={waiting}
          onPress={onBegin}
          accessibilityHint={`${waiting ? 'Completion is being confirmed for' : 'Opens completion for'} ${quest.title}`}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { gap: spacing.xs },
  featuredFrame: { gap: 10 },
  card: {
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(6, 42, 90, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    ...shadows,
  },
  featuredCard: {
    borderColor: 'rgba(255, 199, 44, 0.76)',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  titleCopy: { flex: 1, gap: 1 },
  statusIcon: {
    width: 29,
    height: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  title: { fontFamily: fontFamilies.bodyBold, lineHeight: 18 },
  featuredTitle: { fontSize: 19, lineHeight: 21, letterSpacing: -0.38 },
  metadata: { gap: 1 },
  pressed: { opacity: 0.76, transform: [{ scale: 0.99 }] },
});
