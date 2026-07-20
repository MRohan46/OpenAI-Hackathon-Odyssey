import type { AppPreferences, Quest } from '../types/domain';

export interface DeviceReminder {
  questId: string;
  date: Date;
  title: string;
  body: string;
  route: string;
  kind: 'start' | 'deadline' | 'overdue';
}

export function buildDeviceReminders(
  quests: Quest[],
  preferences: AppPreferences,
  now = new Date(),
): DeviceReminder[] {
  const reminders: DeviceReminder[] = [];
  const lead = preferences.reminderLeadMinutes * 60_000;
  const add = (reminder: DeviceReminder) => {
    if (reminder.date.getTime() > now.getTime() + 1_000) reminders.push(reminder);
  };

  quests
    .filter((quest) => !['completed', 'missed', 'completionPending'].includes(quest.status))
    .forEach((quest) => {
      const scheduledAt = new Date(quest.scheduledAt);
      const deadlineAt = quest.deadlineAt
        ? new Date(quest.deadlineAt)
        : new Date(scheduledAt.getTime() + quest.durationMinutes * 60_000);
      const route = `/quest/${quest.id}`;

      if (preferences.questReminders) {
        add({
          questId: quest.id,
          date: new Date(scheduledAt.getTime() - lead),
          title: `${quest.title} starts soon`,
          body: 'Your next quest begins soon.',
          route,
          kind: 'start',
        });
      }
      if (preferences.deadlineReminders && quest.deadlineAt) {
        add({
          questId: quest.id,
          date: new Date(deadlineAt.getTime() - lead),
          title: `${quest.title} deadline approaching`,
          body: 'Time remains for an honest next step.',
          route,
          kind: 'deadline',
        });
      }
      if (preferences.overdueReminders) {
        add({
          questId: quest.id,
          date: new Date(deadlineAt.getTime() + 60_000),
          title: `${quest.title} is overdue`,
          body: 'The missed time stays honest. Choose the next useful action.',
          route,
          kind: 'overdue',
        });
      }
    });

  // iOS retains at most 64 pending local notifications. Leave a little room
  // for system or future Odyssey notifications and prioritize the nearest work.
  return reminders.sort((left, right) => left.date.getTime() - right.date.getTime()).slice(0, 60);
}
