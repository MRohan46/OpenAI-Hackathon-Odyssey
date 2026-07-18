import { format, isSameDay, parseISO } from 'date-fns';
import { useRouter } from 'expo-router';
import { Bell, Check, ChevronDown, Plus, Route } from 'lucide-react-native';
import React, { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../src/components/Button';
import { ProgressBar } from '../../src/components/ProgressBar';
import { QuestNavigatorDropdown } from '../../src/components/QuestNavigatorDropdown';
import { QuestRoadmapCard } from '../../src/components/QuestRoadmapCard';
import { Typography } from '../../src/components/Typography';
import { useReducedMotion } from '../../src/hooks/useReducedMotion';
import { useApp } from '../../src/state/AppProvider';
import { colors, fontFamilies, layout, radii, spacing } from '../../src/theme/tokens';
import type { Quest } from '../../src/types/domain';
import { formatTime, statusLabel } from '../../src/utils/format';
import { compareQuestAttention, questAttentionReason } from '../../src/utils/questPriority';
import { TideObservatoryBackdrop } from '../../src/world/TideObservatoryBackdrop';

// Rollback switch retained intentionally. The former card-based Today screen remains compilable.
// import { LegacyTodayScreen } from '../../src/screens/LegacyTodayScreen';
// export default LegacyTodayScreen;

type RouteRole = 'upcoming' | 'featured' | 'completed' | 'additionalLeft' | 'additionalRight';

interface RouteEntry {
  quest: Quest;
  role: RouteRole;
  top: number;
}

function buildRouteEntries(ordered: Quest[], featured?: Quest): RouteEntry[] {
  const entries: RouteEntry[] = [];
  const represented = new Set<string>();
  const upcoming = ordered.find((quest) => quest.status === 'upcoming' && quest.id !== featured?.id);
  const completed = ordered.find((quest) => quest.status === 'completed' && quest.id !== featured?.id);

  const add = (quest: Quest | undefined, role: RouteRole, top: number) => {
    if (!quest || represented.has(quest.id)) return;
    represented.add(quest.id);
    entries.push({ quest, role, top });
  };

  add(upcoming, 'upcoming', 248);
  add(featured, 'featured', 500);
  add(completed, 'completed', 790);

  ordered
    .filter((quest) => !represented.has(quest.id))
    .forEach((quest, index) => {
      add(quest, index % 2 === 0 ? 'additionalLeft' : 'additionalRight', 1030 + index * 210);
    });

  return entries;
}

function questStatusText(quest: Quest) {
  const time = quest.status === 'completed' ? quest.completedAt ?? quest.scheduledAt : quest.scheduledAt;
  const deadline = quest.status !== 'completed' && quest.deadlineAt ? `–${formatTime(quest.deadlineAt)}` : '';
  return `${statusLabel[quest.status]} · ${formatTime(time)}${deadline}`;
}

export default function TodayScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const reducedMotion = useReducedMotion();
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const { profile, goals, quests, notifications, preferences } = useApp();
  const focusDate = useMemo(() => {
    const visible = quests.filter((quest) => quest.status !== 'missed' && quest.status !== 'completed');
    return parseISO((visible[0] ?? quests[0])?.scheduledAt ?? new Date().toISOString());
  }, [quests]);
  const dayQuests = useMemo(
    () => quests.filter((quest) => isSameDay(parseISO(quest.scheduledAt), focusDate)),
    [focusDate, quests],
  );
  const ordered = useMemo(
    () => [...dayQuests].sort((a, b) => compareQuestAttention(a, b, goals, focusDate)),
    [dayQuests, focusDate, goals],
  );
  const featured = ordered.find((quest) => quest.status !== 'completed' && quest.status !== 'missed' && quest.status !== 'upcoming');
  const activeGoal = goals.find((goal) => goal.id === featured?.goalId) ?? goals[0];
  const routeEntries = useMemo(() => buildRouteEntries(ordered, featured), [featured, ordered]);
  const additionalCount = routeEntries.filter((entry) => entry.role.startsWith('additional')).length;
  const sceneHeight = Math.max(1120, 1140 + additionalCount * 210);
  const unread = notifications.filter((item) => !item.read).length;
  const dateSource = featured?.scheduledAt ?? dayQuests[0]?.scheduledAt ?? new Date().toISOString();

  const jumpToQuest = (questId: string) => {
    const entry = routeEntries.find((candidate) => candidate.quest.id === questId);
    if (entry) {
      scrollRef.current?.scrollTo({ y: Math.max(0, entry.top - 190), animated: !reducedMotion });
    }
    setNavigatorOpen(false);
  };

  return (
    <View style={styles.root} testID="today-screen">
      <View style={styles.frame}>
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => setNavigatorOpen(false)}
          showsVerticalScrollIndicator={false}
          testID="today-roadmap-scroll"
        >
          <View style={[styles.scene, { height: sceneHeight }]}>
            <TideObservatoryBackdrop
              reducedMotion={reducedMotion}
              highContrast={preferences.highContrast}
              compact={compact}
            />

            <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
              <View style={styles.header}>
                <View style={styles.headerTopline}>
                  <Typography variant="micro" style={styles.date}>
                    Today · {format(new Date(dateSource), compact ? 'EEE d MMM' : 'EEEE d MMMM')}
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
                      accessibilityLabel={`Open today's ${dayQuests.length} quest navigator`}
                      accessibilityState={{ expanded: navigatorOpen }}
                      aria-expanded={navigatorOpen}
                      onPress={() => setNavigatorOpen((open) => !open)}
                      style={({ pressed }) => [styles.navigatorButton, pressed && styles.pressed]}
                      testID="quest-navigator-trigger"
                    >
                      <Route size={17} color={colors.ink} />
                      <Typography variant="micro" style={styles.navigatorCount}>
                        {dayQuests.length}
                      </Typography>
                      <ChevronDown
                        size={14}
                        color={colors.inkSecondary}
                        style={navigatorOpen ? styles.chevronOpen : undefined}
                      />
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
                {navigatorOpen ? (
                  <QuestNavigatorDropdown
                    quests={ordered}
                    onSelect={jumpToQuest}
                    onClose={() => setNavigatorOpen(false)}
                  />
                ) : null}
                <View style={styles.streakRow}>
                  <View style={styles.sunDot} />
                  <Typography variant="body" style={styles.streakText}>
                    {profile.overallStreak} day streak
                  </Typography>
                </View>
                <Typography variant="display" style={[styles.headline, compact && styles.headlineCompact]}>
                  One clear step
                </Typography>
              </View>

              {activeGoal ? (
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
                    <Typography variant="micro" color={colors.inkSecondary}>
                      {activeGoal.progress}% journey
                    </Typography>
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
              ) : null}

              {featured ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${featured.title}`}
                  accessibilityHint="Opens quest details"
                  onPress={() => router.push(`/quest/${featured.id}`)}
                  style={({ pressed }) => [
                    styles.activeNodeHit,
                    compact && styles.activeNodeHitCompact,
                    pressed && styles.activeNodePressed,
                  ]}
                  testID="active-quest-island"
                />
              ) : null}

              {routeEntries.map((entry) => {
                const isFeatured = entry.role === 'featured';
                const canBegin =
                  isFeatured &&
                  (entry.quest.status === 'scheduled' ||
                    entry.quest.status === 'overdue' ||
                    entry.quest.status === 'inProgress' ||
                    entry.quest.status === 'completionPending');
                return (
                  <View
                    key={entry.quest.id}
                    style={[
                      styles.routeEntry,
                      { top: entry.top },
                      entry.role === 'upcoming' && styles.entryUpcoming,
                      entry.role === 'featured' && styles.entryFeatured,
                      entry.role === 'completed' && styles.entryCompleted,
                      entry.role === 'additionalLeft' && styles.entryAdditionalLeft,
                      entry.role === 'additionalRight' && styles.entryAdditionalRight,
                    ]}
                  >
                    <QuestRoadmapCard
                      quest={entry.quest}
                      statusText={questStatusText(entry.quest)}
                      featured={isFeatured}
                      onPress={() => router.push(`/quest/${entry.quest.id}`)}
                      onBegin={
                        canBegin
                          ? () => router.push(`/quest/${entry.quest.id}/complete`)
                          : undefined
                      }
                      reason={isFeatured ? questAttentionReason(entry.quest, goals, focusDate) : undefined}
                    />
                  </View>
                );
              })}

              {routeEntries.some((entry) => entry.role === 'completed') ? (
                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={[styles.completedCheck, compact && styles.completedCheckCompact]}
                >
                  <Check size={26} strokeWidth={3} color={colors.white} />
                </View>
              ) : null}

              {routeEntries.length === 0 ? (
                <View style={styles.emptyRoute}>
                  <Typography variant="heading">The shore is clear</Typography>
                  <Typography variant="body" color={colors.inkSecondary}>
                    Add a quest and Odyssey will place it on today&apos;s route.
                  </Typography>
                  <Button label="Create a quest" icon={Plus} onPress={() => router.push('/quest/new')} />
                </View>
              ) : null}

              <View style={[styles.routeFooter, { top: sceneHeight - 125 }]}>
                <Typography variant="micro" color={colors.inkSecondary}>
                  Every quest for this day is on the route · {dayQuests.length} total
                </Typography>
              </View>
            </SafeAreaView>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', backgroundColor: colors.sky },
  frame: { flex: 1, width: '100%', maxWidth: layout.contentMax, overflow: 'hidden', backgroundColor: colors.sky },
  scroll: { flex: 1 },
  scrollContent: { alignItems: 'center' },
  scene: { width: '100%', minHeight: 1040, overflow: 'hidden', backgroundColor: colors.sand },
  safe: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  header: { position: 'absolute', top: spacing.xs, left: spacing.lg, right: spacing.lg, zIndex: 15 },
  headerTopline: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  date: { textTransform: 'uppercase', letterSpacing: 0.35 },
  quickActions: { flexDirection: 'row', gap: 5 },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(6, 42, 90, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
  },
  navigatorButton: {
    minWidth: 58,
    height: 44,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(6, 42, 90, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
  },
  navigatorCount: { fontFamily: fontFamilies.bodyBold },
  chevronOpen: { transform: [{ rotate: '180deg' }] },
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
  headlineCompact: { fontSize: 38, lineHeight: 41, letterSpacing: -1.65 },
  horizon: {
    position: 'absolute',
    top: 154,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 3,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  levelBlock: { width: '43%', gap: 4 },
  bossBlock: { width: '35%', gap: 3 },
  activeNodeHit: {
    position: 'absolute',
    left: '21%',
    top: 510,
    width: '38%',
    aspectRatio: 1,
    zIndex: 4,
    borderRadius: radii.pill,
  },
  activeNodePressed: { backgroundColor: 'rgba(255, 199, 44, 0.12)', transform: [{ scale: 0.97 }] },
  activeNodeHitCompact: { left: '24%' },
  routeEntry: { position: 'absolute', zIndex: 6 },
  entryUpcoming: { left: '49%', right: '3%' },
  entryFeatured: { left: '46%', right: '3%' },
  entryCompleted: { left: '31%', right: '5%' },
  entryAdditionalLeft: { left: '5%', right: '42%' },
  entryAdditionalRight: { left: '42%', right: '5%' },
  completedCheck: {
    position: 'absolute',
    top: 790,
    left: '4%',
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  completedCheckCompact: { left: '25%' },
  emptyRoute: {
    position: 'absolute',
    top: 390,
    left: spacing.lg,
    right: spacing.lg,
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 5,
  },
  routeFooter: { position: 'absolute', left: spacing.lg, right: spacing.lg, alignItems: 'center', zIndex: 4 },
  pressed: { opacity: 0.72 },
});
