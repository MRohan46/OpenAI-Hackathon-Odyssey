import { useRouter } from 'expo-router';
import { Award, Gem, Gift, ShieldCheck, Sparkles, Zap } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '../src/components/Button';
import { Chip } from '../src/components/Chip';
import { LivingScreen } from '../src/components/LivingScreen';
import { ProgressBar } from '../src/components/ProgressBar';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { SectionHeader } from '../src/components/SectionHeader';
import { Surface } from '../src/components/Surface';
import { Typography } from '../src/components/Typography';
import { useApp } from '../src/state/AppProvider';
import { colors, radii, spacing } from '../src/theme/tokens';

export default function RewardsScreen() {
  const router = useRouter();
  const { profile, rewards, selectCosmetic } = useApp();
  return (
    <LivingScreen immersive dim={0.1}>
      <ScreenHeader back title="Rewards" eyebrow="Earned, never farmed" />
      <Surface tone="ink" padding="large" style={styles.level}>
        <View style={styles.levelTop}><View><Typography variant="micro" color={colors.sun}>ACCOUNT LEVEL {profile.accountLevel}</Typography><Typography variant="title" color={colors.white}>{profile.xp.toLocaleString()} XP</Typography></View><Award size={35} color={colors.sun} /></View>
        <ProgressBar value={(profile.xp / profile.xpToNextLevel) * 100} color={colors.sun} trackColor="rgba(255,255,255,0.18)" accessibilityLabel="XP to next account level" />
        <Typography variant="micro" color="rgba(255,255,255,0.7)">XP is permanent account progress. It is not your roadmap level.</Typography>
      </Surface>
      <View style={styles.balances}>
        <Surface padding="medium" style={styles.balance}><Gem size={24} color={colors.waterDeep} /><Typography variant="title">{rewards.rubies}</Typography><Typography variant="micro" color={colors.inkSecondary}>Rubies</Typography></Surface>
        <Surface padding="medium" style={styles.balance}><Gift size={24} color={colors.coral} /><Typography variant="title">{rewards.unopenedChests}</Typography><Typography variant="micro" color={colors.inkSecondary}>Earned chests</Typography></Surface>
        <Surface padding="medium" style={styles.balance}><ShieldCheck size={24} color={colors.sun} /><Typography variant="title">{rewards.streakProtection}</Typography><Typography variant="micro" color={colors.inkSecondary}>Streak guards</Typography></Surface>
      </View>
      {rewards.unopenedChests > 0 ? <Button label="Open an earned chest" icon={Gift} onPress={() => router.push('/rewards/chest/tide-chest-1')} /> : null}
      <SectionHeader title="Boosts" description="Helpful advantages that never complete work for you" />
      {rewards.boosts.map((boost) => <Surface key={boost.id} padding="medium" style={styles.row}><View style={styles.itemIcon}><Zap size={19} color={colors.coral} /></View><View style={styles.copy}><Typography variant="label">{boost.name}</Typography><Typography variant="micro" color={colors.inkSecondary}>{boost.description}</Typography></View><Chip label={`×${boost.quantity}`} tone="coral" /></Surface>)}
      <SectionHeader title="Cosmetics" description="Appearance only—never confused with progress" />
      {rewards.cosmetics.map((cosmetic) => (
        <Surface key={cosmetic.id} padding="medium" style={[styles.row, !cosmetic.unlocked && styles.locked]}>
          <View style={styles.itemIcon}><Sparkles size={19} color={cosmetic.unlocked ? colors.sun : colors.inkSecondary} /></View>
          <View style={styles.copy}><Typography variant="label">{cosmetic.name}</Typography><Typography variant="micro" color={colors.inkSecondary}>{cosmetic.description}</Typography></View>
          {cosmetic.selected ? <Chip label="Wearing" selected tone="water" /> : cosmetic.unlocked ? <Button label="Wear" compact variant="secondary" onPress={() => selectCosmetic(cosmetic.id)} /> : <Chip label="Locked" />}
        </Surface>
      ))}
    </LivingScreen>
  );
}
const styles = StyleSheet.create({
  level: { gap: spacing.sm }, levelTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, balances: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  balance: { flex: 1, minWidth: 104, gap: 3 }, row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, itemIcon: { width: 42, height: 42, borderRadius: radii.md, backgroundColor: colors.sky, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, gap: 2 }, locked: { opacity: 0.62 },
});
