import { buildDeviceReminders } from '../src/utils/deviceReminders';
import type { AppPreferences, Quest } from '../src/types/domain';

const preferences: AppPreferences = {
  reducedMotionOverride: 'system',
  haptics: true,
  highContrast: false,
  graphicsQuality: 'auto',
  questReminders: true,
  deadlineReminders: true,
  overdueReminders: true,
  reminderLeadMinutes: 15,
};

const quest = (id: string, scheduledAt: string, deadlineAt?: string): Quest => ({
  id,
  goalId: 'goal',
  title: `Quest ${id}`,
  description: '',
  kind: 'task',
  status: 'scheduled',
  scheduledAt,
  deadlineAt,
  durationMinutes: 30,
  priority: 'medium',
  plannedIntensity: 'normal',
  proofPolicy: 'none',
  rewardXp: 45,
  rewardRubies: 6,
  bossDamage: 3,
});

describe('device reminder schedule', () => {
  it('builds start, deadline, and overdue reminders at their real times', () => {
    const reminders = buildDeviceReminders(
      [quest('one', '2026-07-20T10:00:00.000Z', '2026-07-20T11:00:00.000Z')],
      preferences,
      new Date('2026-07-20T09:00:00.000Z'),
    );

    expect(reminders.map((item) => [item.kind, item.date.toISOString()])).toEqual([
      ['start', '2026-07-20T09:45:00.000Z'],
      ['deadline', '2026-07-20T10:45:00.000Z'],
      ['overdue', '2026-07-20T11:01:00.000Z'],
    ]);
  });

  it('does not schedule disabled, completed, or past reminders', () => {
    const reminders = buildDeviceReminders(
      [
        { ...quest('done', '2026-07-20T10:00:00.000Z'), status: 'completed' },
        quest('future', '2026-07-20T12:00:00.000Z'),
      ],
      { ...preferences, questReminders: false, overdueReminders: false },
      new Date('2026-07-20T09:00:00.000Z'),
    );

    expect(reminders).toEqual([]);
  });
});
