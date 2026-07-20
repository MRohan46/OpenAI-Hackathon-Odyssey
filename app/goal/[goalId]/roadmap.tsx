import { useLocalSearchParams, useRouter } from 'expo-router';
import { Route, Save } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '../../../src/components/Button';
import { EmptyState } from '../../../src/components/EmptyState';
import { LivingScreen } from '../../../src/components/LivingScreen';
import { RoadmapLevelEditor } from '../../../src/components/RoadmapLevelEditor';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { Surface } from '../../../src/components/Surface';
import { Typography } from '../../../src/components/Typography';
import { useApp } from '../../../src/state/AppProvider';
import type { RoadmapLevel } from '../../../src/types/domain';
import { normalizeRoadmapLevels } from '../../../src/utils/roadmap';
import { colors, spacing } from '../../../src/theme/tokens';

export default function EditAcceptedRoadmapScreen() {
  const { goalId } = useLocalSearchParams<{ goalId: string }>();
  const router = useRouter();
  const { goals, updateGoal } = useApp();
  const goal = goals.find((item) => item.id === goalId && item.status === 'active');
  const [levels, setLevels] = useState<RoadmapLevel[]>(() => structuredClone(goal?.roadmap ?? []));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!goal) return <LivingScreen><ScreenHeader back /><EmptyState icon={Route} title="Active route unavailable" message="Only active Odysseys can change future roadmap guidance." /></LivingScreen>;

  const change = (levelId: string, input: Partial<RoadmapLevel>) => setLevels((current) => current.map((level) => level.id === levelId ? { ...level, ...input } : level));
  const move = (levelId: string, direction: -1 | 1) => setLevels((current) => {
    const source = current.findIndex((level) => level.id === levelId);
    const target = source + direction;
    if (source < 0 || target < 0 || target >= current.length) return current;
    if (current[source].status === 'completed' || current[target].status === 'completed') return current;
    const next = [...current];
    [next[source], next[target]] = [next[target], next[source]];
    return normalizeRoadmapLevels(next);
  });
  const regenerate = (levelId: string) => {
    const source = levels.find((level) => level.id === levelId);
    if (!source) return;
    change(levelId, {
      purpose: `Create a practical next stage for ${goal.shortTitle.toLowerCase()} without changing completed evidence.`,
      milestone: `Confirm the evidence needed to finish ${source.title.toLowerCase()}.`,
      habits: [`Practice ${source.title.toLowerCase()}`, 'Review progress and adjust'],
      tasks: [`Define completion evidence`, `Finish the ${source.title.toLowerCase()} milestone`],
    });
  };
  const save = async () => {
    setSaving(true);
    setError(null);
    const result = await updateGoal(goal.id, { roadmap: levels });
    setSaving(false);
    if (result) setError(result);
    else router.replace(`/goal/${goal.id}`);
  };

  return (
    <LivingScreen dim={0.18}>
      <ScreenHeader back title="Edit active route" eyebrow="Future guidance only" />
      <Surface tone="ink" padding="large" style={styles.intro}><Typography variant="title" color={colors.white}>{goal.shortTitle}</Typography><Typography variant="body" color="rgba(255,255,255,0.72)">Completed stages and evidence stay fixed. Edit future level guidance, habits, tasks, and milestones, then save deliberately.</Typography></Surface>
      <View style={styles.levels}>
        {levels.map((level, index) => <RoadmapLevelEditor key={level.id} level={level} index={index} count={levels.length} readOnly={level.status === 'completed'} onChange={(input) => change(level.id, input)} onMove={(direction) => move(level.id, direction)} onRegenerate={() => regenerate(level.id)} onSchedule={(title, kind) => router.push({ pathname: '/quest/new', params: { title, kind, goalId: goal.id } })} />)}
      </View>
      {error ? <Typography variant="body" color={colors.coralText}>{error}</Typography> : null}
      <Button label="Save future route guidance" icon={Save} loading={saving} onPress={save} />
    </LivingScreen>
  );
}

const styles = StyleSheet.create({ intro: { gap: spacing.sm }, levels: { gap: spacing.sm } });
