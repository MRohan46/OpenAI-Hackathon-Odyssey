import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, Check, Gem, Shield, Sparkles } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '../../../src/components/Button';
import { ChoiceGroup } from '../../../src/components/ChoiceGroup';
import { EmptyState } from '../../../src/components/EmptyState';
import { LivingScreen } from '../../../src/components/LivingScreen';
import { LoadingTide } from '../../../src/components/LoadingTide';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { Surface } from '../../../src/components/Surface';
import { Typography } from '../../../src/components/Typography';
import { useApp } from '../../../src/state/AppProvider';
import type { Intensity } from '../../../src/types/domain';
import { colors, spacing } from '../../../src/theme/tokens';
import { titleCase } from '../../../src/utils/format';

export default function CompleteQuestScreen() {
  const { questId } = useLocalSearchParams<{ questId: string }>();
  const router = useRouter();
  const { quests, goals, activeProofUri, completionState, completionReceipt, completionError, completeQuest, resetCompletion } = useApp();
  const quest = quests.find((item) => item.id === questId);
  const goal = goals.find((item) => item.id === quest?.goalId);
  const [actualIntensity, setActualIntensity] = useState<Intensity>(quest?.plannedIntensity ?? 'normal');
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; resetCompletion(); }
  }, [resetCompletion]);

  if (!quest) return <LivingScreen><ScreenHeader back /><EmptyState icon={Check} title="Quest unavailable" message="This quest cannot be completed from the current link." /></LivingScreen>;
  if (completionState === 'pending') return <LivingScreen immersive dim={0.08} contentStyle={styles.pending}><ScreenHeader back /><LoadingTide label="Confirming completion and rewards…" /><Typography variant="body" color={colors.inkSecondary} style={styles.center}>The celebration waits for the server receipt. Boss health and balances have not moved yet.</Typography></LivingScreen>;
  if (completionState === 'confirmed' && completionReceipt) return (
    <LivingScreen immersive accent={colors.sun} dim={0.04} contentStyle={styles.confirmed}>
      <View style={styles.victoryMark}><Sparkles size={42} color={colors.sun} /></View>
      <Typography variant="display" style={styles.center}>Quest confirmed.</Typography>
      <Typography variant="body" color={colors.inkSecondary} style={styles.center}>You showed up with {titleCase(completionReceipt.quest.actualIntensity ?? actualIntensity)} effort. The path moved because the work did.</Typography>
      <Surface tone="ink" padding="large" style={styles.receipt}>
        <View style={styles.receiptItem}><Sparkles size={21} color={colors.sun} /><Typography variant="heading" color={colors.white}>+{completionReceipt.rewards.xp} XP</Typography></View>
        <View style={styles.receiptItem}><Gem size={21} color={colors.water} /><Typography variant="heading" color={colors.white}>+{completionReceipt.rewards.rubies} rubies</Typography></View>
        <View style={styles.receiptItem}><Shield size={21} color={colors.coral} /><Typography variant="heading" color={colors.white}>{completionReceipt.bossHealth}% boss health</Typography></View>
      </Surface>
      <Button label="Return to Today" onPress={() => router.replace('/(tabs)/today')} />
      <Button label="See the journey move" variant="secondary" onPress={() => router.replace(`/goal/${quest.goalId}`)} />
    </LivingScreen>
  );

  const proofMissing = quest.proofPolicy === 'required' && !activeProofUri;
  return (
    <LivingScreen immersive accent={goal?.accent} dim={0.1}>
      <ScreenHeader back title="Record the work" eyebrow="Completion check" />
      <View style={styles.hero}><Typography variant="display">How did you show up?</Typography><Typography variant="body" color={colors.inkSecondary}>Planned: {titleCase(quest.plannedIntensity)}. Record the actual session without rewriting the plan.</Typography></View>
      <Surface padding="large" style={styles.form}>
        <ChoiceGroup label="Actual intensity" value={actualIntensity} options={['light', 'normal', 'intense'] as const} onChange={setActualIntensity} />
        <Surface tone="sand" padding="medium" style={styles.proof}>
          <View style={styles.proofCopy}><Typography variant="label">Private photo proof</Typography><Typography variant="micro" color={colors.inkSecondary}>{activeProofUri ? 'Proof selected locally. It is not uploaded until the backend confirms.' : quest.proofPolicy === 'required' ? 'Required for this habit occurrence.' : quest.proofPolicy === 'optional' ? 'Optional for your own accountability.' : 'Not used for this quest.'}</Typography></View>
          {quest.proofPolicy !== 'none' ? <Button label={activeProofUri ? 'Change proof' : 'Add proof'} icon={Camera} compact variant="secondary" onPress={() => router.push('/proof/capture')} /> : null}
        </Surface>
        {proofMissing ? <Typography variant="micro" color={colors.coralText}>Add private proof before asking the server to confirm this quest.</Typography> : null}
        {completionError ? <Typography variant="micro" color={colors.coralText}>{completionError}</Typography> : null}
        <Button label="Confirm completed quest" icon={Check} disabled={proofMissing} onPress={async () => { await completeQuest(quest.id, actualIntensity, activeProofUri ?? undefined); }} />
      </Surface>
      <Typography variant="micro" color={colors.inkSecondary} style={styles.center}>Rewards, streaks, roadmap progress, and boss damage move only after confirmed completion.</Typography>
    </LivingScreen>
  );
}
const styles = StyleSheet.create({
  hero: { gap: spacing.sm }, form: { gap: spacing.lg }, proof: { gap: spacing.md }, proofCopy: { gap: 3 }, center: { textAlign: 'center' },
  pending: { flex: 1, justifyContent: 'center' }, confirmed: { flex: 1, justifyContent: 'center', alignItems: 'stretch' },
  victoryMark: { alignSelf: 'center', width: 88, height: 88, borderRadius: 44, backgroundColor: colors.mistStrong, alignItems: 'center', justifyContent: 'center' },
  receipt: { gap: spacing.md }, receiptItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
