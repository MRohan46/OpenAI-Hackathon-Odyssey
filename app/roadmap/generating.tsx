import { useLocalSearchParams, useRouter } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '../../src/components/Button';
import { LivingScreen } from '../../src/components/LivingScreen';
import { LoadingTide } from '../../src/components/LoadingTide';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Surface } from '../../src/components/Surface';
import { Typography } from '../../src/components/Typography';
import { useApp } from '../../src/state/AppProvider';
import type { Intensity } from '../../src/types/domain';
import { colors, spacing } from '../../src/theme/tokens';

export default function GeneratingRoadmapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, string>>();
  const { generateRoadmap } = useApp();
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(true);

  const generate = async () => {
    setError(null);
    setGenerating(true);
    try {
      const result = await generateRoadmap({
        goalTitle: params.goalTitle || 'A new meaningful goal',
        deadline: params.deadline || '2026-12-31',
        startingPoint: params.startingPoint || 'Beginning with a clear intention.',
        availableDays: (params.availableDays || 'Mon,Wed,Fri').split(','),
        minutesPerDay: Number(params.minutesPerDay || 45),
        preferredIntensity: (params.preferredIntensity || 'normal') as Intensity,
        constraints: params.constraints || 'Keep the route sustainable.',
      });
      if (result) setError(result);
      else router.replace('/roadmap/review');
    } catch {
      setError('Odyssey could not start roadmap generation. Your goal has not been created; please try again.');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void generate();
  });

  return (
    <LivingScreen immersive dim={0.08} contentStyle={styles.content}>
      <ScreenHeader back eyebrow="Protected AI boundary" />
      <View style={styles.center}>
        <View style={styles.orb}><Sparkles size={34} color={colors.sun} /></View>
        <Typography variant="display" style={styles.centerText}>Charting ten possible shores.</Typography>
        <Typography variant="body" color={colors.inkSecondary} style={styles.centerText}>This is a proposal, not an active plan. You can edit, move, remove, or regenerate every part before accepting.</Typography>
      </View>
      {generating ? <Typography variant="micro" color={colors.inkSecondary} style={styles.centerText}>Please wait—creating a thoughtful route can take up to two minutes.</Typography> : null}
      {error ? (
        <Surface padding="large" style={styles.error}>
          <Typography variant="heading">The tide did not return a plan.</Typography>
          <Typography variant="body" color={colors.coralText}>{error}</Typography>
          <Button label="Try generation again" onPress={generate} loading={generating} />
        </Surface>
      ) : <LoadingTide label="Building a route around your real life…" />}
      {/* <View style={styles.trust}><LockKeyhole size={17} color={colors.waterDeep} /><Typography variant="micro" color={colors.inkSecondary}>AI credentials stay server-side. No generated route activates itself.</Typography></View> */}
    </LivingScreen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'space-between' },
  center: { alignItems: 'center', gap: spacing.md, paddingTop: 90 },
  centerText: { textAlign: 'center' },
  orb: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.mistStrong, alignItems: 'center', justifyContent: 'center' },
  trust: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  error: { gap: spacing.md },
});
