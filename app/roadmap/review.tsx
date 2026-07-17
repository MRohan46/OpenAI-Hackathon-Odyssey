import { useRouter } from 'expo-router';
import { ArrowDown, ArrowUp, Check, Pencil, RefreshCw, Shield } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '../../src/components/Button';
import { Chip } from '../../src/components/Chip';
import { LivingScreen } from '../../src/components/LivingScreen';
import { LoadingTide } from '../../src/components/LoadingTide';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Surface } from '../../src/components/Surface';
import { Typography } from '../../src/components/Typography';
import { createExampleRoadmapDraft, useApp } from '../../src/state/AppProvider';
import { colors, fontFamilies, radii, spacing } from '../../src/theme/tokens';

export default function ReviewRoadmapScreen() {
  const router = useRouter();
  const { activeRoadmapDraft, generateRoadmap, updateRoadmapLevel, moveRoadmapLevel, acceptRoadmap } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeRoadmapDraft) {
      const draft = createExampleRoadmapDraft();
      void generateRoadmap({
        goalTitle: draft.goalTitle,
        deadline: draft.deadline,
        startingPoint: draft.startingPoint,
        availableDays: draft.availableDays,
        minutesPerDay: draft.minutesPerDay,
        preferredIntensity: draft.preferredIntensity,
        constraints: draft.constraints,
      });
    }
  }, [activeRoadmapDraft, generateRoadmap]);

  if (!activeRoadmapDraft) return <LivingScreen dim={0.2}><ScreenHeader back /><LoadingTide label="Restoring your proposed route…" /></LivingScreen>;

  const accept = async () => {
    setAccepting(true);
    setError(null);
    const goal = await acceptRoadmap();
    setAccepting(false);
    if (!goal) setError('The route was not confirmed. Your proposal is still editable.');
    else router.replace(`/goal/${goal.id}`);
  };

  const regenerate = async () => {
    setError(null);
    const result = await generateRoadmap({
      goalTitle: activeRoadmapDraft.goalTitle,
      deadline: activeRoadmapDraft.deadline,
      startingPoint: activeRoadmapDraft.startingPoint,
      availableDays: activeRoadmapDraft.availableDays,
      minutesPerDay: activeRoadmapDraft.minutesPerDay,
      preferredIntensity: activeRoadmapDraft.preferredIntensity,
      constraints: activeRoadmapDraft.constraints,
    });
    if (result) setError(result);
  };

  return (
    <LivingScreen dim={0.2}>
      <ScreenHeader back title="Review the route" eyebrow="Proposal · not active" />
      <Surface tone="ink" padding="large" style={styles.summary}>
        <Typography variant="title" color={colors.white}>{activeRoadmapDraft.goalTitle}</Typography>
        <Typography variant="body" color="rgba(255,255,255,0.72)">Ten levels · {activeRoadmapDraft.minutesPerDay} min on {activeRoadmapDraft.availableDays.join(', ')}</Typography>
        <Chip label="You remain in control" selected tone="water" />
      </Surface>
      <View style={styles.levels}>
        {activeRoadmapDraft.levels.map((level, index) => (
          <Surface key={level.id} padding="medium" style={styles.level}>
            <View style={styles.levelTop}>
              <View style={[styles.levelNumber, level.bossType !== 'none' && styles.bossNumber]}>{level.bossType !== 'none' ? <Shield size={17} color={colors.ink} /> : <Typography variant="label">{index + 1}</Typography>}</View>
              <View style={styles.levelCopy}>
                {editingId === level.id ? (
                  <TextInput accessibilityLabel={`Level ${index + 1} title`} value={level.title} onChangeText={(value) => updateRoadmapLevel(level.id, value)} onBlur={() => setEditingId(null)} autoFocus style={styles.editInput} />
                ) : <Typography variant="heading">{level.title}</Typography>}
                <Typography variant="micro" color={colors.inkSecondary}>{level.bossType === 'final' ? 'FINAL BOSS' : level.bossType === 'mini' ? 'MINI-BOSS' : `LEVEL ${index + 1}`}</Typography>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel={`Edit level ${index + 1}`} style={styles.icon} onPress={() => setEditingId(level.id)}><Pencil size={17} color={colors.ink} /></Pressable>
            </View>
            <Typography variant="body" color={colors.inkSecondary}>{level.purpose}</Typography>
            <View style={styles.moves}>
              <Pressable accessibilityRole="button" accessibilityLabel={`Move level ${index + 1} up`} disabled={index === 0} style={[styles.move, index === 0 && styles.disabled]} onPress={() => moveRoadmapLevel(level.id, -1)}><ArrowUp size={17} color={colors.ink} /><Typography variant="micro">Earlier</Typography></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={`Move level ${index + 1} down`} disabled={index === activeRoadmapDraft.levels.length - 1} style={[styles.move, index === activeRoadmapDraft.levels.length - 1 && styles.disabled]} onPress={() => moveRoadmapLevel(level.id, 1)}><ArrowDown size={17} color={colors.ink} /><Typography variant="micro">Later</Typography></Pressable>
            </View>
          </Surface>
        ))}
      </View>
      {error ? <Typography variant="micro" color={colors.coralText}>{error}</Typography> : null}
      <Button label="Accept and activate this route" icon={Check} onPress={accept} loading={accepting} />
      <Button label="Regenerate the proposal" icon={RefreshCw} variant="secondary" onPress={regenerate} />
      <Typography variant="micro" color={colors.inkSecondary} style={styles.center}>Accepting creates a live roadmap. Until then, this stays a proposal.</Typography>
    </LivingScreen>
  );
}

const styles = StyleSheet.create({
  summary: { gap: spacing.sm, alignItems: 'flex-start' },
  levels: { gap: spacing.sm },
  level: { gap: spacing.sm },
  levelTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  levelNumber: { width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.sky, alignItems: 'center', justifyContent: 'center' },
  bossNumber: { backgroundColor: colors.sun },
  levelCopy: { flex: 1 },
  icon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  editInput: { fontFamily: fontFamilies.displayMedium, color: colors.ink, fontSize: 22, borderBottomWidth: 1, borderBottomColor: colors.water },
  moves: { flexDirection: 'row', gap: spacing.xs },
  move: { minHeight: 40, borderRadius: radii.pill, backgroundColor: colors.sand, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: spacing.sm },
  disabled: { opacity: 0.3 },
  center: { textAlign: 'center' },
});
