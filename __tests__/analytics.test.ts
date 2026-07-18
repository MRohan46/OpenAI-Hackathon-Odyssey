import { buildGoalAnalytics, buildHabitAnalytics, buildOverallAnalytics } from '../src/utils/analytics';
import type { Goal, Quest } from '../src/types/domain';

const goal: Goal = {
  id: 'g1', title: 'Goal', shortTitle: 'Goal', description: 'Goal', deadline: '2026-08-30', currentLevel: 2,
  progress: 20, accent: '#fff', status: 'active', bossName: 'Boss', bossHealth: 80,
  roadmap: [{ id: 'l1', number: 1, title: 'One', purpose: 'One', status: 'completed', milestone: 'Done', bossType: 'none', habits: [], tasks: [] }],
};
const quest = (id: string, scheduledAt: string, status: Quest['status'], actualIntensity?: Quest['actualIntensity']): Quest => ({
  id, seriesId: 'series', goalId: 'g1', title: 'Habit', description: 'Habit', kind: 'habit', status, scheduledAt,
  durationMinutes: 30, priority: 'medium', plannedIntensity: 'normal', actualIntensity, proofPolicy: 'optional',
  rewardXp: 20, rewardRubies: 3, bossDamage: 2, completedAt: status === 'completed' ? scheduledAt : undefined,
});

describe('derived analytics', () => {
  const quests = [
    quest('recent', '2026-07-18T09:00:00Z', 'completed', 'intense'),
    quest('miss', '2026-07-16T09:00:00Z', 'missed'),
    quest('older', '2026-07-01T09:00:00Z', 'completed', 'light'),
  ];
  const now = new Date('2026-07-18T12:00:00Z');

  it('produces distinct week and month evidence', () => {
    const week = buildOverallAnalytics(quests, 'week', now);
    const month = buildOverallAnalytics(quests, 'month', now);
    expect(week.questsCompleted).toBe(1);
    expect(month.questsCompleted).toBe(2);
    expect(week.daily).toHaveLength(7);
    expect(month.daily).toHaveLength(5);
  });

  it('builds habit and goal models from matching records', () => {
    const habit = buildHabitAnalytics(quests[0], quests);
    const goalModel = buildGoalAnalytics(goal, quests, now);
    expect(habit.completed).toBe(2);
    expect(habit.missed).toBe(1);
    expect(goalModel.completedStages).toBe(1);
    expect(goalModel.connectedQuestCompletion).toBe(67);
  });
});
