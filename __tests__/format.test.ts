import { formatDate, formatTime, statusLabel, titleCase, toShortTitle } from '../src/utils/format';

describe('presentation formatting', () => {
  it('formats local quest times without blurring status', () => {
    expect(formatTime('2026-07-17T19:00:00+05:30')).toBe('7:00 PM');
    expect(statusLabel.scheduled).toBe('Scheduled');
    expect(statusLabel.completed).toBe('Completed');
    expect(statusLabel.missed).toBe('Missed');
    expect(statusLabel.overdue).toBe('Overdue');
  });

  it('formats dates and labels for readable UI copy', () => {
    expect(formatDate('2026-09-25T12:00:00+05:30')).toBe('Sep 25, 2026');
    expect(titleCase('intense')).toBe('Intense');
    expect(toShortTitle('Prepare confidently for my mathematics examination')).toBe('Prepare confidently for my');
  });
});
