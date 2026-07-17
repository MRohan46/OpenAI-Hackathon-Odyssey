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

const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const days = Array.from({ length: 35 }, (_, index) => index - 2);

export default function CalendarScreen() {
  const router = useRouter();
  const { quests } = useApp();
  const [selectedDay, setSelectedDay] = useState(17);
  const [view, setView] = useState<'month' | 'week'>('month');
  const selectedQuests = useMemo(() => (selectedDay === 17 ? quests : []), [quests, selectedDay]);
  return (
    <LivingScreen dim={0.24} testID="calendar-screen">
      <ScreenHeader title="Calendar" eyebrow="July 2026" showNotifications />
      <View style={styles.controls}>
        <View style={styles.toggle}><Chip label="Month" selected={view === 'month'} onPress={() => setView('month')} /><Chip label="Week" selected={view === 'week'} onPress={() => setView('week')} /></View>
        <Button label="Add" icon={Plus} compact variant="secondary" onPress={() => router.push('/quest/new')} />
      </View>
      <Surface padding="medium" style={styles.calendar}>
        <View style={styles.monthTitle}>
          <Pressable accessibilityRole="button" accessibilityLabel="Previous month" style={styles.nav}><ChevronLeft size={20} color={colors.ink} /></Pressable>
          <Typography variant="heading">July</Typography>
          <Pressable accessibilityRole="button" accessibilityLabel="Next month" style={styles.nav}><ChevronRight size={20} color={colors.ink} /></Pressable>
        </View>
        <View style={styles.grid}>
          {weekdays.map((day, index) => <View key={`${day}-${index}`} style={styles.cell}><Typography variant="micro" color={colors.inkSecondary}>{day}</Typography></View>)}
          {days.map((day, index) => {
            const valid = day > 0 && day <= 31;
            const hasQuest = day === 17 || day === 18 || day === 21 || day === 24;
            const selected = day === selectedDay;
            return (
              <Pressable
                key={`${day}-${index}`}
                accessibilityRole="button"
                accessibilityLabel={valid ? `July ${day}${hasQuest ? ', quests scheduled' : ''}` : 'Outside July'}
                disabled={!valid}
                onPress={() => setSelectedDay(day)}
                style={[styles.cell, selected && styles.selectedCell]}
              >
                <Typography variant="label" color={selected ? colors.white : valid ? colors.ink : colors.inkSecondary}>{valid ? day : ''}</Typography>
                {hasQuest ? <View style={[styles.eventDot, selected && styles.eventDotSelected]} /> : null}
              </Pressable>
            );
          })}
        </View>
      </Surface>
      <SectionHeader title={selectedDay === 17 ? 'Friday, 17 July' : `July ${selectedDay}`} description={selectedQuests.length ? `${selectedQuests.length} scheduled moments` : 'A clear shore'} />
      {selectedQuests.length ? selectedQuests.map((quest) => <QuestCard key={quest.id} quest={quest} onPress={() => router.push(`/quest/${quest.id}`)} />) : (
        <Surface padding="large" style={styles.empty}><Typography variant="heading">Nothing scheduled.</Typography><Typography variant="body" color={colors.inkSecondary}>Rest is allowed. Add a quest only if this day needs one.</Typography></Surface>
      )}
    </LivingScreen>
  );
}

const styles = StyleSheet.create({
  controls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  toggle: { flexDirection: 'row', gap: spacing.xs },
  calendar: { gap: spacing.md },
  monthTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nav: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.285%', aspectRatio: 0.98, alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: radii.sm },
  selectedCell: { backgroundColor: colors.ink },
  eventDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.coral },
  eventDotSelected: { backgroundColor: colors.sun },
  empty: { gap: spacing.xs },
});
