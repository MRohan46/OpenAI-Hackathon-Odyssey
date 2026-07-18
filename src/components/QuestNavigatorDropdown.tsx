import { ChevronUp, Route } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { Quest } from '../types/domain';
import { colors, fontFamilies, radii, shadows, spacing } from '../theme/tokens';
import { formatTime, statusLabel } from '../utils/format';
import { Typography } from './Typography';

interface QuestNavigatorDropdownProps {
  quests: Quest[];
  onSelect: (questId: string) => void;
  onClose: () => void;
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

export function QuestNavigatorDropdown({ quests, onSelect, onClose }: QuestNavigatorDropdownProps) {
  return (
    <View accessibilityViewIsModal style={styles.menu} testID="quest-navigator-dropdown">
      <View style={styles.menuHeader}>
        <View style={styles.menuTitle}>
          <Route size={16} color={colors.ink} />
          <Typography variant="label">Today&apos;s route</Typography>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close quest navigator"
          hitSlop={8}
          onPress={onClose}
          style={({ pressed }) => [styles.close, pressed && styles.pressed]}
        >
          <ChevronUp size={18} color={colors.inkSecondary} />
        </Pressable>
      </View>
      <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} style={styles.list}>
        {quests.map((quest) => (
          <Pressable
            key={quest.id}
            accessibilityRole="button"
            accessibilityLabel={`Jump to ${quest.title}. ${statusLabel[quest.status]} at ${formatTime(
              quest.status === 'completed' ? quest.completedAt ?? quest.scheduledAt : quest.scheduledAt,
            )}`}
            onPress={() => onSelect(quest.id)}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
          >
            <View style={[styles.dot, { backgroundColor: statusColor[quest.status] }]} />
            <View style={styles.itemCopy}>
              <Typography variant="label" style={styles.itemTitle} numberOfLines={2}>
                {quest.title}
              </Typography>
              <Typography variant="micro" color={colors.inkSecondary}>
                {statusLabel[quest.status]} ·{' '}
                {formatTime(quest.status === 'completed' ? quest.completedAt ?? quest.scheduledAt : quest.scheduledAt)}
              </Typography>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    top: 48,
    right: 48,
    width: 286,
    maxWidth: '82%',
    padding: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(6, 42, 90, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    zIndex: 20,
    ...shadows,
  },
  menuHeader: {
    minHeight: 38,
    paddingHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuTitle: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  close: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill },
  list: { maxHeight: 292 },
  item: {
    minHeight: 58,
    paddingHorizontal: 6,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderTopWidth: 1,
    borderTopColor: 'rgba(6, 42, 90, 0.08)',
  },
  dot: { width: 8, height: 8, borderRadius: radii.pill },
  itemCopy: { flex: 1, gap: 1 },
  itemTitle: { fontFamily: fontFamilies.bodyBold },
  pressed: { opacity: 0.7 },
});
