import { differenceInMinutes, parseISO } from 'date-fns';

import type { Goal, Priority, Quest, QuestStatus } from '../types/domain';

const statusWeight: Record<QuestStatus, number> = {
  overdue: 0,
  inProgress: 1,
  completionPending: 1,
  scheduled: 2,
  upcoming: 3,
  completed: 8,
  missed: 9,
};

const priorityWeight: Record<Priority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function relevantLevelBonus(quest: Quest, goals: Goal[]) {
  const goal = goals.find((item) => item.id === quest.goalId);
  return goal?.status === 'active' && goal.currentLevel >= 8 ? -1 : 0;
}

export function compareQuestAttention(a: Quest, b: Quest, goals: Goal[], now = new Date()) {
  const statusDifference = statusWeight[a.status] - statusWeight[b.status];
  if (statusDifference !== 0) return statusDifference;

  const aDeadline = a.deadlineAt ? differenceInMinutes(parseISO(a.deadlineAt), now) : Number.POSITIVE_INFINITY;
  const bDeadline = b.deadlineAt ? differenceInMinutes(parseISO(b.deadlineAt), now) : Number.POSITIVE_INFINITY;
  const aOverdue = aDeadline < 0 ? -2 : 0;
  const bOverdue = bDeadline < 0 ? -2 : 0;
  const urgencyDifference = aOverdue + priorityWeight[a.priority] + relevantLevelBonus(a, goals)
    - (bOverdue + priorityWeight[b.priority] + relevantLevelBonus(b, goals));
  if (urgencyDifference !== 0) return urgencyDifference;
  if (aDeadline !== bDeadline) return aDeadline - bDeadline;
  return parseISO(a.scheduledAt).getTime() - parseISO(b.scheduledAt).getTime();
}

export function questAttentionReason(quest: Quest, goals: Goal[], now = new Date()) {
  if (quest.status === 'overdue') return 'Overdue work rises first so it can be faced or rescheduled.';
  if (quest.deadlineAt && parseISO(quest.deadlineAt) < now) return 'Its deadline has passed and needs a decision.';
  if (quest.priority === 'critical') return 'Critical priority makes this the clearest next step.';
  if (quest.priority === 'high') return 'High priority keeps meaningful work above easier distractions.';
  const goal = goals.find((item) => item.id === quest.goalId);
  if (goal && goal.currentLevel >= 8) return 'This quest supports a late-stage Odyssey milestone.';
  return 'Scheduled time and roadmap relevance place it on today’s route.';
}
