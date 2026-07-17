import { useRouter } from 'expo-router';
import { Award, BarChart3, Gem, Settings, ShieldCheck, Sparkles } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '../../src/components/Button';
import { LivingScreen } from '../../src/components/LivingScreen';
import { ProgressBar } from '../../src/components/ProgressBar';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { StatCard } from '../../src/components/StatCard';
import { Surface } from '../../src/components/Surface';
import { Typography } from '../../src/components/Typography';
import { useApp } from '../../src/state/AppProvider';
import { colors, radii, spacing } from '../../src/theme/tokens';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, rewards } = useApp();
  const xpPercent = (profile.xp / profile.xpToNextLevel) * 100;
  return (
    <LivingScreen dim={0.22} testID="profile-screen">
      <ScreenHeader title="Profile" eyebrow="Permanent progress" showNotifications />
      <Surface padding="large" style={styles.identity}>
        <View style={styles.avatar}><Sparkles size={32} color={colors.sun} /></View>
        <View style={styles.identityCopy}>
          <Typography variant="title">{profile.name}</Typography>
          <Typography variant="label" color={colors.inkSecondary}>{profile.handle}</Typography>
          <Typography variant="micro" color={colors.waterDeep}>{profile.selectedCosmetic}</Typography>
        </View>
      </Surface>
      <Surface tone="ink" padding="large" style={styles.level}>
        <View style={styles.levelRow}><View><Typography variant="micro" color={colors.sun}>ACCOUNT LEVEL</Typography><Typography variant="display" color={colors.white}>{profile.accountLevel}</Typography></View><Award size={42} color={colors.sun} /></View>
        <ProgressBar value={xpPercent} color={colors.sun} trackColor="rgba(255,255,255,0.18)" accessibilityLabel="Account level XP progress" />
        <Typography variant="micro" color="rgba(255,255,255,0.72)">{profile.xp.toLocaleString()} / {profile.xpToNextLevel.toLocaleString()} XP</Typography>
      </Surface>
      <View style={styles.stats}>
        <StatCard icon={Gem} value={rewards.rubies.toString()} label="Rubies" />
        <StatCard icon={ShieldCheck} value={rewards.streakProtection.toString()} label="Streak guards" color={colors.coral} />
        <StatCard icon={Sparkles} value={rewards.unopenedChests.toString()} label="Chests" color={colors.sun} />
      </View>
      <View style={styles.actions}>
        <Button label="Rewards and cosmetics" icon={Award} variant="secondary" onPress={() => router.push('/rewards')} />
        <Button label="Progress analytics" icon={BarChart3} variant="secondary" onPress={() => router.push('/analytics')} />
        <Button label="Settings and trust" icon={Settings} variant="secondary" onPress={() => router.push('/settings')} />
      </View>
    </LivingScreen>
  );
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 76, height: 76, borderRadius: radii.pill, backgroundColor: colors.sky, borderWidth: 4, borderColor: colors.water, alignItems: 'center', justifyContent: 'center' },
  identityCopy: { flex: 1, gap: 2 },
  level: { gap: spacing.sm },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  actions: { gap: spacing.sm },
});
