import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  parse,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

import type { Quest } from '../types/domain';

export type CalendarView = 'month' | 'week';
export type RecurrenceFrequency = 'daily' | 'weekly' | 'custom';

export interface DateTimeParts {
  date: string;
  time: string;
}

export interface RecurrenceDraft {
  frequency: RecurrenceFrequency;
  days: string[];
  interval: number;
}

export const weekdayOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export function toDateTimeParts(value: string): DateTimeParts {
  const date = parseISO(value);
  return { date: format(date, 'yyyy-MM-dd'), time: format(date, 'HH:mm') };
}

export function fromDateTimeParts({ date, time }: DateTimeParts) {
  const parsed = parse(`${date} ${time}`, 'yyyy-MM-dd HH:mm', new Date());
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function formatRecurrence({ frequency, days, interval }: RecurrenceDraft) {
  if (frequency === 'daily') return 'Daily';
  if (frequency === 'weekly') return days.length ? days.join(', ') : 'Weekly';
  return `Every ${Math.max(2, interval)} days`;
}

export function parseRecurrence(value?: string): RecurrenceDraft {
  if (!value || value === 'Daily') return { frequency: 'daily', days: [], interval: 2 };
  if (value === 'Weekdays') return { frequency: 'weekly', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], interval: 2 };
  const interval = value.match(/Every (\d+) days/i)?.[1];
  if (interval) return { frequency: 'custom', days: [], interval: Number(interval) };
  const longNames: Record<(typeof weekdayOptions)[number], string> = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' };
  const days = weekdayOptions.filter((day) => value.includes(day) || value.includes(longNames[day]));
  return { frequency: 'weekly', days, interval: 2 };
}

export function moveCalendarCursor(cursor: Date, view: CalendarView, direction: -1 | 1) {
  return view === 'month' ? addMonths(cursor, direction) : addWeeks(cursor, direction);
}

export function calendarDates(cursor: Date, view: CalendarView) {
  const start = view === 'month'
    ? startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 })
    : startOfWeek(cursor, { weekStartsOn: 1 });
  const end = view === 'month'
    ? endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 })
    : endOfWeek(cursor, { weekStartsOn: 1 });
  const result: Date[] = [];
  for (let current = start; current <= end; current = addDays(current, 1)) result.push(current);
  return result;
}

export function questsOnDate(quests: Quest[], date: Date) {
  return quests.filter((quest) => isSameDay(parseISO(quest.scheduledAt), date));
}
