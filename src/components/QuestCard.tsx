import { Check, Clock3, TriangleAlert } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { Quest } from '../types/domain';
import { colors, radii, spacing } from '../theme/tokens';
import { formatTime, statusLabel, titleCase } from '../utils/format';
import { Chip } from './Chip';
import { Surface } from './Surface';
import { Typography } from './Typography';

interface QuestCardProps {
  quest: Quest;
  featured?: boolean;
  onPress: () => void;
}

const statusTone = {
  scheduled: colors.sun,
  inProgress: colors.water,
  completionPending: colors.water,
  completed: colors.success,
  upcoming: colors.inkSecondary,
  overdue: colors.coral,
  missed: colors.coralText,
} as const;

export function QuestCard({ quest, featured = false, onPress }: QuestCardProps) {
  const StatusIcon = quest.status === 'completed' ? Check : quest.status === 'overdue' || quest.status === 'missed' ? TriangleAlert : Clock3;
  return (
    <Surface onPress={onPress} accessibilityLabel={`Open ${quest.title}`} padding="medium" style={featured ? styles.featured : undefined}>
      <View style={styles.top}>
        <View style={[styles.statusIcon, { backgroundColor: `${statusTone[quest.status]}1F` }]}>
          <StatusIcon size={18} color={statusTone[quest.status]} />
        </View>
        <View style={styles.copy}>
          <Typography variant={featured ? 'title' : 'heading'}>{quest.title}</Typography>
          <Typography variant="label" color={colors.inkSecondary}>
            {formatTime(quest.scheduledAt)} · {quest.durationMinutes} min
          </Typography>
        </View>
      </View>
      <View style={styles.chips}>
        <Chip label={statusLabel[quest.status]} tone={quest.status === 'completed' ? 'success' : quest.status === 'overdue' ? 'coral' : 'water'} dot />
        <Chip label={`${titleCase(quest.priority)} priority`} tone={quest.priority === 'critical' || quest.priority === 'high' ? 'coral' : 'default'} />
        <Chip label={titleCase(quest.plannedIntensity)} tone="sun" />
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  featured: { borderColor: 'rgba(255, 199, 44, 0.72)', borderWidth: 2 },
  top: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  statusIcon: { width: 38, height: 38, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.md },
});
