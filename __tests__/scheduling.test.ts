import { format } from 'date-fns';

import { calendarDates, formatRecurrence, moveCalendarCursor, questsOnDate } from '../src/utils/scheduling';
import type { Quest } from '../src/types/domain';

const quest: Quest = {
  id: 'q1', goalId: 'g1', title: 'Study', description: 'Study well', kind: 'habit', status: 'scheduled',
  scheduledAt: '2026-07-18T09:00:00+05:30', durationMinutes: 30, priority: 'high', plannedIntensity: 'normal',
  proofPolicy: 'none', rewardXp: 10, rewardRubies: 2, bossDamage: 1,
};

describe('calendar and recurrence scheduling', () => {
  it('builds distinct month and week ranges and moves by the selected period', () => {
    const cursor = new Date('2026-07-18T12:00:00+05:30');
    expect(calendarDates(cursor, 'week')).toHaveLength(7);
    expect(calendarDates(cursor, 'month')).toHaveLength(35);
    expect(format(moveCalendarCursor(cursor, 'month', 1), 'yyyy-MM')).toBe('2026-08');
    expect(format(moveCalendarCursor(cursor, 'week', -1), 'yyyy-MM-dd')).toBe('2026-07-11');
  });

  it('filters real quest dates and formats structured recurrence rules', () => {
    expect(questsOnDate([quest], new Date('2026-07-18T16:00:00+05:30'))).toEqual([quest]);
    expect(questsOnDate([quest], new Date('2026-07-19T09:00:00+05:30'))).toEqual([]);
    expect(formatRecurrence({ frequency: 'weekly', days: ['Mon', 'Fri'], interval: 2 })).toBe('Mon, Fri');
    expect(formatRecurrence({ frequency: 'custom', days: [], interval: 3 })).toBe('Every 3 days');
  });
});
