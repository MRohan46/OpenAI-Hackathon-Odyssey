import { ArrowDown, ArrowUp, CalendarPlus, ChevronDown, ChevronUp, Plus, RefreshCw, Shield, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { RoadmapLevel } from '../types/domain';
import { colors, radii, spacing } from '../theme/tokens';
import { Button } from './Button';
import { Field } from './Field';
import { Surface } from './Surface';
import { Typography } from './Typography';

interface RoadmapLevelEditorProps {
  level: RoadmapLevel;
  index: number;
  count: number;
  onChange: (input: Partial<RoadmapLevel>) => void;
  onMove: (direction: -1 | 1) => void;
  onRegenerate: () => void | Promise<void>;
  regenerating?: boolean;
  onSchedule: (title: string, kind: 'habit' | 'task') => void;
  readOnly?: boolean;
  schedulingEnabled?: boolean;
}

export function RoadmapLevelEditor({ level, index, count, onChange, onMove, onRegenerate, onSchedule, regenerating = false, readOnly = false, schedulingEnabled = true }: RoadmapLevelEditorProps) {
  const [expanded, setExpanded] = useState(index === 0 && !readOnly);
  const [newHabit, setNewHabit] = useState('');
  const [newTask, setNewTask] = useState('');
  const add = (kind: 'habits' | 'tasks', value: string, clear: () => void) => {
    const clean = value.trim();
    if (!clean) return;
    onChange({ [kind]: [...level[kind], clean] });
    clear();
  };
  const remove = (kind: 'habits' | 'tasks', itemIndex: number) => onChange({ [kind]: level[kind].filter((_, candidate) => candidate !== itemIndex) });

  return (
    <Surface padding="medium" style={styles.level}>
      <View style={styles.levelTop}>
        <View style={[styles.levelNumber, level.bossType !== 'none' && styles.bossNumber]}>{level.bossType !== 'none' ? <Shield size={17} color={colors.ink} /> : <Typography variant="label">{index + 1}</Typography>}</View>
        <View style={styles.levelCopy}>
          <Typography variant="heading">{level.title}</Typography>
          <Typography variant="micro" color={colors.inkSecondary}>{level.bossType === 'final' ? 'FINAL BOSS' : level.bossType === 'mini' ? 'MINI-BOSS' : `LEVEL ${index + 1}`}</Typography>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={`${expanded ? 'Collapse' : readOnly ? 'Review' : 'Edit'} level ${index + 1}`} accessibilityState={{ expanded }} onPress={() => setExpanded((value) => !value)} style={styles.icon}>{expanded ? <ChevronUp size={20} color={colors.ink} /> : <ChevronDown size={20} color={colors.ink} />}</Pressable>
      </View>
      <Typography variant="body" color={colors.inkSecondary}>{level.purpose}</Typography>
      {expanded ? (
        <View style={styles.editor}>
          {readOnly ? <Typography variant="micro" color={colors.success}>Completed level · preserved as confirmed history</Typography> : null}
          <Field label="Level title" value={level.title} editable={!readOnly} onChangeText={(title) => onChange({ title })} />
          <Field label="Purpose" value={level.purpose} editable={!readOnly} onChangeText={(purpose) => onChange({ purpose })} multiline />
          <Field label="Milestone evidence" value={level.milestone} editable={!readOnly} onChangeText={(milestone) => onChange({ milestone })} multiline />
          <Typography variant="label">Suggested habits</Typography>
          {level.habits.map((habit, habitIndex) => (
            <View key={`${habit}-${habitIndex}`} style={styles.suggestion}>
              <Typography variant="body" style={styles.suggestionCopy}>{habit}</Typography>
              {!readOnly && schedulingEnabled ? <Pressable accessibilityRole="button" accessibilityLabel={`Schedule habit ${habit}`} onPress={() => onSchedule(habit, 'habit')} style={styles.icon}><CalendarPlus size={18} color={colors.waterDeep} /></Pressable> : null}
              {!readOnly ? <Pressable accessibilityRole="button" accessibilityLabel={`Remove habit ${habit}`} onPress={() => remove('habits', habitIndex)} style={styles.icon}><Trash2 size={17} color={colors.coralText} /></Pressable> : null}
            </View>
          ))}
          {!readOnly ? <View style={styles.addRow}><View style={styles.addField}><Field label="Add a suggested habit" value={newHabit} onChangeText={setNewHabit} /></View><Button label="Add" icon={Plus} compact variant="secondary" onPress={() => add('habits', newHabit, () => setNewHabit(''))} /></View> : null}
          <Typography variant="label">Suggested one-time tasks</Typography>
          {level.tasks.map((task, taskIndex) => (
            <View key={`${task}-${taskIndex}`} style={styles.suggestion}>
              <Typography variant="body" style={styles.suggestionCopy}>{task}</Typography>
              {!readOnly && schedulingEnabled ? <Pressable accessibilityRole="button" accessibilityLabel={`Schedule task ${task}`} onPress={() => onSchedule(task, 'task')} style={styles.icon}><CalendarPlus size={18} color={colors.waterDeep} /></Pressable> : null}
              {!readOnly ? <Pressable accessibilityRole="button" accessibilityLabel={`Remove task ${task}`} onPress={() => remove('tasks', taskIndex)} style={styles.icon}><Trash2 size={17} color={colors.coralText} /></Pressable> : null}
            </View>
          ))}
          {!readOnly ? <View style={styles.addRow}><View style={styles.addField}><Field label="Add a suggested task" value={newTask} onChangeText={setNewTask} /></View><Button label="Add" icon={Plus} compact variant="secondary" onPress={() => add('tasks', newTask, () => setNewTask(''))} /></View> : null}
          {!readOnly ? <Button label="Regenerate only this level" icon={RefreshCw} compact variant="secondary" onPress={onRegenerate} loading={regenerating} /> : null}
        </View>
      ) : null}
      {!readOnly ? <View style={styles.moves}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Move level ${index + 1} earlier`} disabled={index === 0} style={[styles.move, index === 0 && styles.disabled]} onPress={() => onMove(-1)}><ArrowUp size={17} color={colors.ink} /><Typography variant="micro">Earlier</Typography></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`Move level ${index + 1} later`} disabled={index === count - 1} style={[styles.move, index === count - 1 && styles.disabled]} onPress={() => onMove(1)}><ArrowDown size={17} color={colors.ink} /><Typography variant="micro">Later</Typography></Pressable>
      </View> : null}
    </Surface>
  );
}

const styles = StyleSheet.create({
  level: { gap: spacing.sm },
  levelTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  levelNumber: { width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.sky, alignItems: 'center', justifyContent: 'center' },
  bossNumber: { backgroundColor: colors.sun },
  levelCopy: { flex: 1 },
  icon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  editor: { gap: spacing.md, paddingTop: spacing.xs },
  suggestion: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: spacing.xs },
  suggestionCopy: { flex: 1 },
  addRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  addField: { flex: 1 },
  moves: { flexDirection: 'row', gap: spacing.xs },
  move: { minHeight: 44, borderRadius: radii.pill, backgroundColor: colors.sand, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: spacing.sm },
  disabled: { opacity: 0.3 },
});
