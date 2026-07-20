import { differenceInCalendarDays, format, isAfter, parseISO, startOfDay, subDays } from 'date-fns';

import type { Goal, GoalAnalytics, HabitAnalytics, Intensity, OverallAnalytics, Quest } from '../types/domain';

const zeroIntensity = (): Record<Intensity, number> => ({ light: 0, normal: 0, intense: 0 });

export function buildOverallAnalytics(quests: Quest[], period: OverallAnalytics['period'], now = new Date()): OverallAnalytics {
  const days = period === 'week' ? 7 : 30;
  const start = startOfDay(subDays(now, days - 1));
  const inPeriod = quests.filter((quest) => isAfter(parseISO(quest.scheduledAt), subDays(start, 1)));
  const decided = inPeriod.filter((quest) => quest.status === 'completed' || quest.status === 'missed');
  const completed = inPeriod.filter((quest) => quest.status === 'completed');
  const intensity = zeroIntensity();
  completed.forEach((quest) => {
    if (quest.actualIntensity) intensity[quest.actualIntensity] += 1;
  });
  const buckets = period === 'week' ? 7 : 5;
  const bucketSize = period === 'week' ? 1 : 6;
  const daily = Array.from({ length: buckets }, (_, index) => {
    const bucketStart = subDays(now, days - 1 - index * bucketSize);
    const bucketEnd = subDays(now, days - 1 - Math.min(days - 1, (index + 1) * bucketSize - 1));
    const scheduled = inPeriod.filter((quest) => {
      const date = parseISO(quest.scheduledAt);
      return date >= startOfDay(bucketStart) && date <= new Date(bucketEnd.getFullYear(), bucketEnd.getMonth(), bucketEnd.getDate(), 23, 59, 59);
    });
    const done = scheduled.filter((quest) => quest.status === 'completed').length;
    return {
      label: period === 'week' ? format(bucketStart, 'EEE') : `W${index + 1}`,
      value: scheduled.length ? Math.round((done / scheduled.length) * 100) : 0,
    };
  });
  const activeDays = new Set(completed.map((quest) => format(parseISO(quest.completedAt ?? quest.scheduledAt), 'yyyy-MM-dd'))).size;
  return {
    period,
    questsCompleted: completed.length,
    completionRate: decided.length ? Math.round((completed.length / decided.length) * 100) : 0,
    consistency: Math.min(100, Math.round((activeDays / days) * 100)),
    xpEarned: completed.reduce((sum, quest) => sum + quest.rewardXp, 0),
    rubiesEarned: completed.reduce((sum, quest) => sum + quest.rewardRubies, 0),
    intensity,
    daily,
  };
}

export function buildHabitAnalytics(quest: Quest, quests: Quest[]): HabitAnalytics {
  const series = quests.filter((item) => item.id === quest.id || (quest.seriesId && item.seriesId === quest.seriesId));
  const completed = series.filter((item) => item.status === 'completed');
  const missed = series.filter((item) => item.status === 'missed');
  const decided = series
    .filter((item) => item.status === 'completed' || item.status === 'missed' || item.status === 'overdue')
    .sort((left, right) => parseISO(left.scheduledAt).getTime() - parseISO(right.scheduledAt).getTime());
  let runningStreak = 0;
  let longestStreak = 0;
  decided.forEach((item) => {
    if (item.status === 'completed') {
      runningStreak += 1;
      longestStreak = Math.max(longestStreak, runningStreak);
    } else if (!item.streakProtected) {
      runningStreak = 0;
    }
  });
  const intensity = zeroIntensity();
  completed.forEach((item) => { if (item.actualIntensity) intensity[item.actualIntensity] += 1; });
  const weekly = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
    const scheduled = series.filter((item) => format(parseISO(item.scheduledAt), 'EEE') === day);
    return {
      day,
      planned: scheduled.reduce((sum, item) => sum + (item.plannedIntensity === 'intense' ? 3 : item.plannedIntensity === 'normal' ? 2 : 1), 0),
      actual: scheduled.reduce((sum, item) => sum + (item.actualIntensity === 'intense' ? 3 : item.actualIntensity === 'normal' ? 2 : item.actualIntensity === 'light' ? 1 : 0), 0),
    };
  });
  return {
    habitId: quest.id,
    currentStreak: runningStreak,
    longestStreak,
    scheduled: series.length,
    completed: completed.length,
    missed: missed.length,
    intensity,
    weekly,
  };
}

export function buildGoalAnalytics(goal: Goal, quests: Quest[], now = new Date()): GoalAnalytics {
  const connected = quests.filter((quest) => quest.goalId === goal.id);
  const decided = connected.filter((quest) => quest.status === 'completed' || quest.status === 'missed');
  const completed = connected.filter((quest) => quest.status === 'completed');
  const deadline = parseISO(`${goal.deadline}T23:59:59`);
  const first = connected.length ? Math.min(...connected.map((quest) => parseISO(quest.scheduledAt).getTime())) : now.getTime();
  const totalDays = Math.max(1, differenceInCalendarDays(deadline, new Date(first)));
  const elapsedDays = Math.max(0, differenceInCalendarDays(now, new Date(first)));
  return {
    goalId: goal.id,
    roadmapProgress: goal.progress,
    completedStages: goal.roadmap.filter((level) => level.status === 'completed').length,
    connectedQuestCompletion: decided.length ? Math.round((completed.length / decided.length) * 100) : 0,
    bossHealth: goal.bossHealth,
    deadlineProgress: Math.min(100, Math.round((elapsedDays / totalDays) * 100)),
  };
}
