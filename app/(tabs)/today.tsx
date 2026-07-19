import { format, isSameDay, parseISO } from 'date-fns';
import { useRouter } from 'expo-router';
import { Bell, ChevronDown, Plus, Route } from 'lucide-react-native';
import React, { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../src/components/Button';
import { ProgressBar } from '../../src/components/ProgressBar';
import { QuestNavigatorDropdown } from '../../src/components/QuestNavigatorDropdown';
import { QuestRoadmapCard } from '../../src/components/QuestRoadmapCard';
import { QuestRouteLine, type QuestRoutePoint } from '../../src/components/QuestRouteLine';
import { Typography } from '../../src/components/Typography';
import { useReducedMotion } from '../../src/hooks/useReducedMotion';
import { useApp } from '../../src/state/AppProvider';
import { colors, fontFamilies, layout, radii, spacing } from '../../src/theme/tokens';
import type { Quest } from '../../src/types/domain';
import { formatTime, statusLabel } from '../../src/utils/format';
import { compareQuestAttention, questAttentionReason } from '../../src/utils/questPriority';
import { InfiniteQuestRoad } from '../../src/world/InfiniteQuestRoad';

// Rollback switch retained intentionally. The former card-based Today screen remains compilable.
// import { LegacyTodayScreen } from '../../src/screens/LegacyTodayScreen';
// export default LegacyTodayScreen;

type RouteRole = 'upcoming' | 'featured' | 'completed' | 'additional';
type RouteSide = 'left' | 'right';

interface RouteEntry {
  quest: Quest;
  role: RouteRole;
  side: RouteSide;
  top: number;
}

const ROAD_ASPECT_RATIO = 1821 / 864;
const ROUTE_START = 492;

function buildRouteEntries(ordered: Quest[], featured: Quest | undefined, compact: boolean): RouteEntry[] {
  const quests: { quest: Quest; role: RouteRole }[] = [];
  const represented = new Set<string>();
  const upcoming = ordered.find((quest) => quest.status === 'upcoming' && quest.id !== featured?.id);
  const completed = ordered.find((quest) => quest.status === 'completed' && quest.id !== featured?.id);

  const add = (quest: Quest | undefined, role: RouteRole) => {
    if (!quest || represented.has(quest.id)) return;
    represented.add(quest.id);
    quests.push({ quest, role });
  };

  add(upcoming, 'upcoming');
  add(featured, 'featured');
  add(completed, 'completed');
  ordered.filter((quest) => !represented.has(quest.id)).forEach((quest) => add(quest, 'additional'));

  const gap = compact ? 370 : 392;
  return quests.map((entry, index) => ({
    ...entry,
    side: index % 2 === 0 ? 'left' : 'right',
    top: ROUTE_START + index * gap,
  }));
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
  const frameWidth = Math.min(width, layout.contentMax);
  const compact = frameWidth < 360;
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
  const featured = ordered.find(
    (quest) => quest.status !== 'completed' && quest.status !== 'missed' && quest.status !== 'upcoming',
  );
  const activeGoal = goals.find((goal) => goal.id === featured?.goalId) ?? goals[0];
  const routeEntries = useMemo(
    () => buildRouteEntries(ordered, featured, compact),
    [compact, featured, ordered],
  );
  const panelHeight = frameWidth * ROAD_ASPECT_RATIO;
  const lastEntry = routeEntries.at(-1);
  const contentEnd = Math.max(1900, (lastEntry?.top ?? ROUTE_START) + (lastEntry?.role === 'featured' ? 390 : 300));
  const minimumPanels = Math.max(3, Math.ceil(contentEnd / panelHeight));
  const panelCount = Math.ceil(minimumPanels / 3) * 3;
  const sceneHeight = panelCount * panelHeight;
  const unread = notifications.filter((item) => !item.read).length;
  const dateSource = featured?.scheduledAt ?? dayQuests[0]?.scheduledAt ?? new Date().toISOString();
  const cardWidth = compact ? Math.min(246, frameWidth - 42) : Math.min(292, frameWidth - 54);
  const routeEdge = compact ? 44 : Math.max(52, frameWidth * 0.17);
  const routePoints: QuestRoutePoint[] = [
    { x: frameWidth / 2, y: 365 },
    ...routeEntries.map((entry) => ({
      x: entry.side === 'left' ? routeEdge : frameWidth - routeEdge,
      y: entry.top - 18,
      completed: entry.quest.status === 'completed',
      featured: entry.role === 'featured',
    })),
    { x: frameWidth / 2, y: sceneHeight - 118 },
  ];

  const jumpToQuest = (questId: string) => {
    const entry = routeEntries.find((candidate) => candidate.quest.id === questId);
    if (entry) {
      scrollRef.current?.scrollTo({ y: Math.max(0, entry.top - 180), animated: !reducedMotion });
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
            <InfiniteQuestRoad
              height={sceneHeight}
              panelHeight={panelHeight}
              questTops={routeEntries.map((entry) => entry.top)}
              reducedMotion={reducedMotion}
              compact={compact}
              highContrast={preferences.highContrast}
            />

            <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
              <QuestRouteLine
                width={frameWidth}
                height={sceneHeight}
                points={routePoints}
                highContrast={preferences.highContrast}
              />

              <View style={[styles.header, compact && styles.headerCompact]}>
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
                <View style={styles.routePromise}>
                  <Route size={15} color={colors.waterDeep} />
                  <Typography variant="micro" color={colors.waterDeep} style={styles.routePromiseText}>
                    Every quest is on one living road
                  </Typography>
                </View>
              </View>

              {activeGoal ? (
                <View style={[styles.horizon, compact && styles.horizonCompact]}>
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
                  <View style={styles.horizonDivider} />
                  <View style={styles.bossBlock}>
                    <Typography variant="label" numberOfLines={1}>{activeGoal.bossName}</Typography>
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
                      { top: entry.top, width: cardWidth },
                      entry.side === 'left' ? styles.entryLeft : styles.entryRight,
                    ]}
                  >
                    <View style={[styles.sequenceLabel, entry.side === 'right' && styles.sequenceLabelRight]}>
                      <Typography variant="micro" style={styles.sequenceLabelText}>
                        {String(routeEntries.indexOf(entry) + 1).padStart(2, '0')}
                      </Typography>
                    </View>
                    <QuestRoadmapCard
                      quest={entry.quest}
                      statusText={questStatusText(entry.quest)}
                      featured={isFeatured}
                      onPress={() => router.push(`/quest/${entry.quest.id}`)}
                      onBegin={canBegin ? () => router.push(`/quest/${entry.quest.id}/complete`) : undefined}
                      reason={isFeatured ? questAttentionReason(entry.quest, goals, focusDate) : undefined}
                    />
                  </View>
                );
              })}

              {routeEntries.length === 0 ? (
                <View style={styles.emptyRoute}>
                  <Typography variant="heading">The shore is clear</Typography>
                  <Typography variant="body" color={colors.inkSecondary}>
                    Add a quest and Odyssey will place it on today&apos;s road.
                  </Typography>
                  <Button label="Create a quest" icon={Plus} onPress={() => router.push('/quest/new')} />
                </View>
              ) : null}

              <View style={[styles.routeFooter, { top: sceneHeight - 164 }]}>
                <View style={styles.footerMarker} />
                <Typography variant="label">The road continues</Typography>
                <Typography variant="micro" color={colors.inkSecondary} style={styles.footerCopy}>
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
  frame: {
    flex: 1,
    width: '100%',
    maxWidth: layout.contentMax,
    overflow: 'hidden',
    backgroundColor: colors.sand,
  },
  scroll: { flex: 1 },
  scrollContent: { alignItems: 'center' },
  scene: { width: '100%', minHeight: 1900, overflow: 'hidden', backgroundColor: colors.sand },
  safe: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  header: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.md,
    right: spacing.md,
    zIndex: 15,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 15,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    backgroundColor: 'rgba(255,255,255,0.78)',
  },
  headerCompact: { left: spacing.sm, right: spacing.sm, paddingHorizontal: 13 },
  headerTopline: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  date: { flex: 1, textTransform: 'uppercase', letterSpacing: 0.35 },
  quickActions: { flexDirection: 'row', gap: 4 },
  iconButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(6, 42, 90, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.84)',
  },
  navigatorButton: {
    minWidth: 55,
    height: 42,
    paddingHorizontal: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(6, 42, 90, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
  },
  navigatorCount: { fontFamily: fontFamilies.bodyBold },
  chevronOpen: { transform: [{ rotate: '180deg' }] },
  notificationDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.coral,
    borderWidth: 1,
    borderColor: colors.white,
  },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 4 },
  sunDot: { width: 9, height: 9, borderRadius: radii.pill, backgroundColor: colors.sun },
  streakText: { fontFamily: fontFamilies.bodyMedium, fontSize: 14 },
  headline: { marginTop: 7, fontSize: 39, lineHeight: 41, letterSpacing: -1.8 },
  headlineCompact: { fontSize: 35, lineHeight: 38, letterSpacing: -1.5 },
  routePromise: { marginTop: 9, flexDirection: 'row', alignItems: 'center', gap: 6 },
  routePromiseText: { flex: 1, fontFamily: fontFamilies.bodySemiBold },
  horizon: {
    position: 'absolute',
    top: 229,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 12,
    minHeight: 108,
    paddingHorizontal: 15,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 14,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.82)',
    backgroundColor: 'rgba(255,255,255,0.88)',
  },
  horizonCompact: { left: spacing.md, right: spacing.md, gap: 9, paddingHorizontal: 12 },
  levelBlock: { flex: 1.12, minWidth: 0, gap: 4 },
  bossBlock: { flex: 1, minWidth: 0, gap: 3 },
  horizonDivider: { width: 1, backgroundColor: 'rgba(6,42,90,0.12)' },
  routeEntry: { position: 'absolute', zIndex: 7 },
  entryLeft: { left: spacing.md },
  entryRight: { right: spacing.md },
  sequenceLabel: {
    alignSelf: 'flex-start',
    marginLeft: 19,
    marginBottom: -7,
    zIndex: 2,
    minWidth: 36,
    height: 25,
    paddingHorizontal: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: colors.ink,
  },
  sequenceLabelRight: { alignSelf: 'flex-end', marginLeft: 0, marginRight: 19 },
  sequenceLabelText: { color: colors.white, fontFamily: fontFamilies.bodyBold, letterSpacing: 0.7 },
  emptyRoute: {
    position: 'absolute',
    top: ROUTE_START,
    left: spacing.lg,
    right: spacing.lg,
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    zIndex: 7,
  },
  routeFooter: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 7,
    alignItems: 'center',
    gap: 4,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.86)',
    backgroundColor: 'rgba(255,255,255,0.86)',
  },
  footerMarker: { width: 10, height: 10, borderRadius: radii.pill, backgroundColor: colors.sun, borderWidth: 2, borderColor: colors.ink },
  footerCopy: { textAlign: 'center' },
  pressed: { opacity: 0.72 },
});
