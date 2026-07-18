import type { Goal, Quest } from '../src/types/domain';
import { compareQuestAttention, questAttentionReason } from '../src/utils/questPriority';

const goal: Goal = {
  id: 'g1', title: 'Goal', shortTitle: 'Goal', description: 'Goal', deadline: '2026-10-01', currentLevel: 4,
  progress: 40, accent: '#fff', status: 'active', bossName: 'Boss', bossHealth: 50, roadmap: [],
};
const base: Quest = {
  id: 'base', goalId: 'g1', title: 'Quest', description: 'Quest', kind: 'task', status: 'scheduled',
  scheduledAt: '2026-07-18T10:00:00Z', deadlineAt: '2026-07-18T14:00:00Z', durationMinutes: 30,
  priority: 'medium', plannedIntensity: 'normal', proofPolicy: 'none', rewardXp: 10, rewardRubies: 2, bossDamage: 1,
};

describe('Daily Quest Board attention order', () => {
  const now = new Date('2026-07-18T09:00:00Z');

  it('raises overdue state before scheduled priority', () => {
    const overdue = { ...base, id: 'overdue', status: 'overdue' as const, priority: 'low' as const };
    const critical = { ...base, id: 'critical', priority: 'critical' as const };
    expect([critical, overdue].sort((a, b) => compareQuestAttention(a, b, [goal], now))[0].id).toBe('overdue');
  });

  it('uses priority and then deadline for quests in the same state', () => {
    const high = { ...base, id: 'high', priority: 'high' as const };
    const critical = { ...base, id: 'critical', priority: 'critical' as const, deadlineAt: '2026-07-18T18:00:00Z' };
    expect([high, critical].sort((a, b) => compareQuestAttention(a, b, [goal], now))[0].id).toBe('critical');
    expect(questAttentionReason(critical, [goal], now)).toContain('Critical');
  });
});
