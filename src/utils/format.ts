import { format, isToday, parseISO } from 'date-fns';

import type { QuestStatus } from '../types/domain';

export const formatTime = (value: string) => format(parseISO(value), 'h:mm a');
export const formatDate = (value: string) => format(parseISO(value), 'MMM d, yyyy');
export const formatQuestDate = (value: string) =>
  isToday(parseISO(value)) ? `Today · ${formatTime(value)}` : `${formatDate(value)} · ${formatTime(value)}`;

export const statusLabel: Record<QuestStatus, string> = {
  scheduled: 'Scheduled',
  inProgress: 'In progress',
  completionPending: 'Confirming',
  completed: 'Completed',
  upcoming: 'Upcoming',
  overdue: 'Overdue',
  missed: 'Missed',
};

export const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export const toShortTitle = (value: string, maxLength = 28) => {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) return trimmed;
  const boundary = trimmed.slice(0, maxLength + 1).lastIndexOf(' ');
  return trimmed.slice(0, boundary > 12 ? boundary : maxLength).trim();
};
