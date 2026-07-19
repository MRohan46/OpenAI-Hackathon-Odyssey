import { useRouter } from 'expo-router';
import { Check, RefreshCw } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '../../src/components/Button';
import { Chip } from '../../src/components/Chip';
import { LivingScreen } from '../../src/components/LivingScreen';
import { LoadingTide } from '../../src/components/LoadingTide';
import { RoadmapLevelEditor } from '../../src/components/RoadmapLevelEditor';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Surface } from '../../src/components/Surface';
import { Typography } from '../../src/components/Typography';
import { useApp } from '../../src/state/AppProvider';
import { colors, spacing } from '../../src/theme/tokens';

export default function ReviewRoadmapScreen() {
  const router = useRouter();
  const { activeRoadmapDraft, generateRoadmap, updateRoadmapLevel, regenerateRoadmapLevel, moveRoadmapLevel, acceptRoadmap } = useApp();
  const [accepting, setAccepting] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regeneratingLevelId, setRegeneratingLevelId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeRoadmapDraft) router.replace('/goal/new');
  }, [activeRoadmapDraft, router]);

  if (!activeRoadmapDraft) return <LivingScreen dim={0.2}><ScreenHeader back /><LoadingTide label="Restoring your proposed route…" /></LivingScreen>;

  const accept = async () => {
    setAccepting(true);
    setError(null);
    try {
      const result = await acceptRoadmap();
      if (!result.goal) setError(result.error ?? 'The route was not confirmed. Your proposal is still editable.');
      else router.replace(`/goal/${result.goal.id}`);
    } finally {
      setAccepting(false);
    }
  };
  const regenerate = async () => {
    setError(null);
    setRegenerating(true);
    try {
      const result = await generateRoadmap({ goalTitle: activeRoadmapDraft.goalTitle, deadline: activeRoadmapDraft.deadline, startingPoint: activeRoadmapDraft.startingPoint, availableDays: activeRoadmapDraft.availableDays, minutesPerDay: activeRoadmapDraft.minutesPerDay, preferredIntensity: activeRoadmapDraft.preferredIntensity, constraints: activeRoadmapDraft.constraints });
      if (result) setError(result);
    } finally {
      setRegenerating(false);
    }
  };
  const regenerateLevel = async (levelId: string) => {
    setError(null);
    setRegeneratingLevelId(levelId);
    try {
      const result = await regenerateRoadmapLevel(levelId);
      if (result) setError(result);
    } finally {
      setRegeneratingLevelId(null);
    }
  };

  return (
    <LivingScreen dim={0.2}>
      <ScreenHeader back title="Review the route" eyebrow="Proposal · not active" />
      <Surface tone="ink" padding="large" style={styles.summary}>
        <Typography variant="title" color={colors.white}>{activeRoadmapDraft.goalTitle}</Typography>
        <Typography variant="body" color="rgba(255,255,255,0.72)">Ten levels · {activeRoadmapDraft.minutesPerDay} min on {activeRoadmapDraft.availableDays.join(', ')}</Typography>
        <Chip label="You remain in control" selected tone="water" />
      </Surface>
      <Typography variant="body" color={colors.inkSecondary}>Open any level to edit its purpose, milestone, habits, and tasks. Scheduling becomes available only after you deliberately activate the route.</Typography>
      <View style={styles.levels}>
        {activeRoadmapDraft.levels.map((level, index) => (
          <RoadmapLevelEditor
            key={level.id}
            level={level}
            index={index}
            count={activeRoadmapDraft.levels.length}
            schedulingEnabled={false}
            onChange={(input) => updateRoadmapLevel(level.id, input)}
            onMove={(direction) => moveRoadmapLevel(level.id, direction)}
            onRegenerate={() => regenerateLevel(level.id)}
            regenerating={regeneratingLevelId === level.id}
            onSchedule={(title, kind) => router.push({ pathname: '/quest/new', params: { title, kind, goalId: '' } })}
          />
        ))}
      </View>
      {error ? <Typography variant="micro" color={colors.coralText}>{error}</Typography> : null}
      <Button label="Accept and activate this route" icon={Check} onPress={accept} loading={accepting} />
      <Button label="Regenerate the full proposal" icon={RefreshCw} variant="secondary" onPress={regenerate} loading={regenerating} disabled={accepting || regeneratingLevelId !== null} />
      <Typography variant="micro" color={colors.inkSecondary} style={styles.center}>Only acceptance creates a live roadmap. Edits and scheduling drafts never activate the AI proposal by themselves.</Typography>
    </LivingScreen>
  );
}

const styles = StyleSheet.create({ summary: { gap: spacing.sm, alignItems: 'flex-start' }, levels: { gap: spacing.sm }, center: { textAlign: 'center' } });
