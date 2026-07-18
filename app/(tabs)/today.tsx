import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import { Bell, Check, Flame, Plus } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../src/components/Button';
import { ProgressBar } from '../../src/components/ProgressBar';
import { Typography } from '../../src/components/Typography';
import { useReducedMotion } from '../../src/hooks/useReducedMotion';
import { useApp } from '../../src/state/AppProvider';
import { colors, fontFamilies, layout, radii, shadows, spacing } from '../../src/theme/tokens';
import type { Quest } from '../../src/types/domain';
import { TideObservatoryBackdrop } from '../../src/world/TideObservatoryBackdrop';

const statusRank = {
  overdue: 0,
  scheduled: 1,
  inProgress: 1,
  completionPending: 1,
  upcoming: 2,
  completed: 3,
  missed: 4,
} as const;

const capitalize = (value: string) => `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
const questTime = (value: string) => format(new Date(value), 'h:mm a');

function QuestLabel({
  quest,
  status,
  onPress,
  testID,
}: {
  quest: Quest;
  status: string;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${quest.title}. ${status}`}
      accessibilityHint="Opens quest details"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.questLabel, pressed && styles.pressed]}
      testID={testID}
    >
      <Typography variant="label" style={styles.questLabelTitle}>
        {quest.title}
      </Typography>
      <Typography variant="micro" color={quest.status === 'completed' ? colors.success : colors.inkSecondary}>
        {status}
      </Typography>
    </Pressable>
  );
}

export default function TodayScreen() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const { profile, goals, quests, notifications, preferences } = useApp();
  const ordered = useMemo(
    () => [...quests].sort((a, b) => statusRank[a.status] - statusRank[b.status]),
    [quests],
  );
  const featured = ordered.find((quest) => quest.status === 'scheduled' || quest.status === 'inProgress');
  const completed = ordered.find((quest) => quest.status === 'completed');
  const upcoming = ordered.find((quest) => quest.status === 'upcoming');
  const activeGoal = goals.find((goal) => goal.id === featured?.goalId) ?? goals[0];
  const represented = new Set([featured?.id, completed?.id, upcoming?.id]);
  const overflow = ordered.filter((quest) => !represented.has(quest.id));
  const unread = notifications.filter((item) => !item.read).length;
  const dateSource = featured?.scheduledAt ?? quests[0]?.scheduledAt ?? new Date().toISOString();

  return (
    <View style={styles.root} testID="today-screen">
      <View style={styles.frame}>
        <TideObservatoryBackdrop reducedMotion={reducedMotion} highContrast={preferences.highContrast} />

        <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
          <View style={styles.header}>
            <View style={styles.headerTopline}>
              <Typography variant="micro" style={styles.date}>
                Today · {format(new Date(dateSource), 'EEEE d MMMM')}
              </Typography>
              <View style={styles.quickActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${unread} unread notifications`}
                  onPress={() => router.push('/notifications')}
                  style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
                >
                  <Bell size={18} color={colors.ink} />
                  {unread > 0 ? <View style={styles.notificationDot} /> : null}
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Create new quest"
                  onPress={() => router.push('/quest/new')}
                  style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
                >
                  <Plus size={19} color={colors.ink} />
                </Pressable>
              </View>
            </View>
            <View style={styles.streakRow}>
              <View style={styles.sunDot} />
              <Typography variant="body" style={styles.streakText}>
                {profile.overallStreak} day streak
              </Typography>
            </View>
            <Typography variant="display" style={styles.headline}>
              One clear step
            </Typography>
          </View>

          <View style={styles.horizon}>
            <View style={styles.levelBlock}>
              <Typography variant="label">Level {activeGoal.currentLevel} of 10</Typography>
              <ProgressBar
                value={(activeGoal.currentLevel / 10) * 100}
                height={4}
                color={colors.sun}
                trackColor="rgba(6, 42, 90, 0.16)"
                accessibilityLabel={`Roadmap level ${activeGoal.currentLevel} of 10`}
              />
            </View>
            <View style={styles.bossBlock}>
              <Typography variant="label">{activeGoal.bossName}</Typography>
              <Typography variant="body">{activeGoal.bossHealth}% health</Typography>
              <ProgressBar
                value={activeGoal.bossHealth}
                height={5}
                color={colors.sun}
                trackColor="rgba(6, 42, 90, 0.16)"
                accessibilityLabel={`${activeGoal.bossName} health`}
              />
            </View>
          </View>

          {upcoming ? (
            <View style={styles.upcomingLabel}>
              <QuestLabel
                quest={upcoming}
                status={`Upcoming · ${questTime(upcoming.scheduledAt)}`}
                onPress={() => router.push(`/quest/${upcoming.id}`)}
                testID="upcoming-quest-label"
              />
            </View>
          ) : null}

          {featured ? (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open ${featured.title}`}
                accessibilityHint="Opens quest details"
                onPress={() => router.push(`/quest/${featured.id}`)}
                style={({ pressed }) => [styles.activeNodeHit, pressed && styles.activeNodePressed]}
                testID="active-quest-island"
              />
              <View style={styles.activeCopy} testID="active-quest-copy">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${featured.title}`}
                  onPress={() => router.push(`/quest/${featured.id}`)}
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <Typography variant="heading" style={styles.activeTitle}>
                    {featured.title}
                  </Typography>
                  <Typography variant="label" style={styles.activeTime}>
                    {questTime(featured.scheduledAt)} · {featured.durationMinutes} min
                  </Typography>
                  <View style={styles.priorityRow}>
                    <View style={styles.coralDot} />
                    <Typography variant="label" color={colors.coralText}>
                      {capitalize(featured.priority)} priority
                    </Typography>
                  </View>
                  <Typography variant="label">
                    Planned: <Typography variant="label" style={styles.strong}>{capitalize(featured.plannedIntensity)}</Typography>
                  </Typography>
                </Pressable>
                <View style={styles.ctaBleed}>
                  <Button
                    label="Begin quest"
                    icon={Flame}
                    onPress={() => router.push(`/quest/${featured.id}/complete`)}
                    accessibilityHint={`Starts completion for ${featured.title}`}
                  />
                </View>
              </View>
            </>
          ) : null}

          {completed ? (
            <>
              <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.completedCheck}>
                <Check size={26} strokeWidth={3} color={colors.white} />
              </View>
              <View style={styles.completedLabel}>
                <QuestLabel
                  quest={completed}
                  status={`Completed · ${questTime(completed.completedAt ?? completed.scheduledAt)}`}
                  onPress={() => router.push(`/quest/${completed.id}`)}
                  testID="completed-quest-label"
                />
              </View>
            </>
          ) : null}

          {overflow.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${overflow.length} additional quest${overflow.length === 1 ? ' needs' : 's need'} attention`}
              accessibilityHint={`Opens ${overflow[0].title}`}
              hitSlop={5}
              onPress={() => router.push(`/quest/${overflow[0].id}`)}
              style={({ pressed }) => [styles.overflowPill, pressed && styles.pressed]}
              testID="overflow-quest-pill"
            >
              <View style={styles.coralDotSmall} />
              <Typography variant="micro" color={colors.coralText} numberOfLines={1}>
                {overflow.length} more quest{overflow.length === 1 ? ' needs' : 's need'} attention
              </Typography>
            </Pressable>
          ) : null}
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', backgroundColor: colors.sky },
  frame: { flex: 1, width: '100%', maxWidth: layout.contentMax, overflow: 'hidden', backgroundColor: colors.sky },
  safe: { flex: 1 },
  header: { position: 'absolute', top: spacing.xs, left: spacing.lg, right: spacing.lg, zIndex: 4 },
  headerTopline: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  date: { textTransform: 'uppercase', letterSpacing: 0.35 },
  quickActions: { flexDirection: 'row', gap: 6 },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(6, 42, 90, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.76)',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.coral,
    borderWidth: 1,
    borderColor: colors.white,
  },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 },
  sunDot: { width: 9, height: 9, borderRadius: radii.pill, backgroundColor: colors.sun },
  streakText: { fontFamily: fontFamilies.bodyMedium, fontSize: 15 },
  headline: { marginTop: 9, fontSize: 42, lineHeight: 44, letterSpacing: -1.9 },
  horizon: {
    position: 'absolute',
    top: '18.2%',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 3,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  levelBlock: { width: '43%', gap: 6 },
  bossBlock: { width: '35%', gap: 3 },
  upcomingLabel: { position: 'absolute', top: '28.3%', left: '54%', right: '5%', zIndex: 4 },
  questLabel: { gap: 1, paddingVertical: 3 },
  questLabelTitle: { fontFamily: fontFamilies.bodyBold },
  activeNodeHit: {
    position: 'absolute',
    left: '21%',
    top: '42.5%',
    width: '38%',
    aspectRatio: 1,
    zIndex: 3,
    borderRadius: radii.pill,
  },
  activeNodePressed: { backgroundColor: 'rgba(255, 199, 44, 0.12)', transform: [{ scale: 0.97 }] },
  activeCopy: { position: 'absolute', top: '44.5%', left: '51%', right: '5%', zIndex: 5, gap: 9 },
  activeTitle: { fontSize: 23, lineHeight: 25, letterSpacing: -0.55 },
  activeTime: { marginTop: 5 },
  priorityRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 7, marginBottom: 5 },
  coralDot: { width: 10, height: 10, borderRadius: radii.pill, backgroundColor: colors.coral },
  strong: { fontFamily: fontFamilies.bodyBold },
  ctaBleed: { marginLeft: -4, marginRight: -16 },
  completedCheck: {
    position: 'absolute',
    top: '73.5%',
    left: '15.2%',
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  completedLabel: { position: 'absolute', top: '73.5%', left: '33%', right: '20%', zIndex: 4 },
  overflowPill: {
    position: 'absolute',
    top: '82%',
    right: spacing.md,
    maxWidth: '67%',
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(179, 58, 46, 0.18)',
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    zIndex: 5,
    ...shadows,
  },
  coralDotSmall: { width: 7, height: 7, borderRadius: radii.pill, backgroundColor: colors.coral },
  pressed: { opacity: 0.72 },
});
