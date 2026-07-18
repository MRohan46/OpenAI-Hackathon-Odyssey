import { format, isSameDay, isSameMonth, parseISO } from 'date-fns';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '../../src/components/Button';
import { Chip } from '../../src/components/Chip';
import { LivingScreen } from '../../src/components/LivingScreen';
import { QuestCard } from '../../src/components/QuestCard';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { SectionHeader } from '../../src/components/SectionHeader';
import { Surface } from '../../src/components/Surface';
import { Typography } from '../../src/components/Typography';
import { useApp } from '../../src/state/AppProvider';
import { colors, radii, spacing } from '../../src/theme/tokens';
import { calendarDates, moveCalendarCursor, questsOnDate, type CalendarView } from '../../src/utils/scheduling';

const weekdayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function CalendarScreen() {
  const router = useRouter();
  const { quests } = useApp();
  const initialDate = quests[0] ? parseISO(quests[0].scheduledAt) : new Date();
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [cursor, setCursor] = useState(initialDate);
  const [view, setView] = useState<CalendarView>('month');
  const dates = useMemo(() => calendarDates(cursor, view), [cursor, view]);
  const selectedQuests = useMemo(() => questsOnDate(quests, selectedDate), [quests, selectedDate]);
  const move = (direction: -1 | 1) => {
    const next = moveCalendarCursor(cursor, view, direction);
    setCursor(next);
    setSelectedDate(next);
  };
  const changeView = (next: CalendarView) => {
    setView(next);
    setCursor(selectedDate);
  };

  return (
    <LivingScreen dim={0.24} testID="calendar-screen">
      <ScreenHeader title="Calendar" eyebrow={format(cursor, 'MMMM yyyy')} showNotifications />
      <View style={styles.controls}>
        <View style={styles.toggle}>
          <Chip label="Month" selected={view === 'month'} onPress={() => changeView('month')} />
          <Chip label="Week" selected={view === 'week'} onPress={() => changeView('week')} />
        </View>
        <Button label="Add" icon={Plus} compact variant="secondary" onPress={() => router.push({ pathname: '/quest/new', params: { date: format(selectedDate, 'yyyy-MM-dd') } })} />
      </View>
      <Surface padding="medium" style={styles.calendar}>
        <View style={styles.monthTitle}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Previous ${view}`} onPress={() => move(-1)} style={styles.nav}><ChevronLeft size={20} color={colors.ink} /></Pressable>
          <View style={styles.periodTitle}>
            <Typography variant="heading">{view === 'month' ? format(cursor, 'MMMM') : `${format(dates[0], 'MMM d')}–${format(dates[dates.length - 1], 'MMM d')}`}</Typography>
            <Typography variant="micro" color={colors.inkSecondary}>{view === 'month' ? 'Month schedule' : 'Seven-day focus'}</Typography>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={`Next ${view}`} onPress={() => move(1)} style={styles.nav}><ChevronRight size={20} color={colors.ink} /></Pressable>
        </View>
        <View style={styles.grid}>
          {weekdayLabels.map((day, index) => <View key={`${day}-${index}`} style={styles.cell}><Typography variant="micro" color={colors.inkSecondary}>{day}</Typography></View>)}
          {dates.map((date) => {
            const dayQuests = questsOnDate(quests, date);
            const selected = isSameDay(date, selectedDate);
            const muted = view === 'month' && !isSameMonth(date, cursor);
            return (
              <Pressable
                key={date.toISOString()}
                accessibilityRole="button"
                accessibilityLabel={`${format(date, 'EEEE, MMMM d')}${dayQuests.length ? `, ${dayQuests.length} quests scheduled` : ', no quests scheduled'}`}
                accessibilityState={{ selected }}
                onPress={() => setSelectedDate(date)}
                style={[styles.cell, view === 'week' && styles.weekCell, selected && styles.selectedCell]}
              >
                <Typography variant="label" color={selected ? colors.white : muted ? colors.inkSecondary : colors.ink}>{format(date, 'd')}</Typography>
                {dayQuests.length ? <View style={[styles.eventDot, selected && styles.eventDotSelected]} /> : null}
              </Pressable>
            );
          })}
        </View>
      </Surface>
      <SectionHeader title={format(selectedDate, 'EEEE, d MMMM')} description={selectedQuests.length ? `${selectedQuests.length} scheduled ${selectedQuests.length === 1 ? 'moment' : 'moments'}` : 'A clear shore'} />
      {selectedQuests.length ? selectedQuests.map((quest) => <QuestCard key={quest.id} quest={quest} onPress={() => router.push(`/quest/${quest.id}`)} />) : (
        <Surface padding="large" style={styles.empty}>
          <Typography variant="heading">Nothing scheduled.</Typography>
          <Typography variant="body" color={colors.inkSecondary}>Rest is allowed. Add a quest only if this day needs one.</Typography>
          <Button label={`Add to ${format(selectedDate, 'MMM d')}`} icon={Plus} variant="secondary" onPress={() => router.push({ pathname: '/quest/new', params: { date: format(selectedDate, 'yyyy-MM-dd') } })} />
        </Surface>
      )}
    </LivingScreen>
  );
}

const styles = StyleSheet.create({
  controls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  toggle: { flexDirection: 'row', gap: spacing.xs },
  calendar: { gap: spacing.md },
  monthTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  periodTitle: { alignItems: 'center', gap: 2 },
  nav: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.285%', minHeight: 44, aspectRatio: 0.98, alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: radii.sm },
  weekCell: { minHeight: 72 },
  selectedCell: { backgroundColor: colors.ink },
  eventDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.coral },
  eventDotSelected: { backgroundColor: colors.sun },
  empty: { gap: spacing.sm },
});
