import { useRouter } from 'expo-router';
import { Award, Gem, Gift, History, ShieldCheck, Sparkles, Zap } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '../src/components/Button';
import { Chip } from '../src/components/Chip';
import { EmptyState } from '../src/components/EmptyState';
import { LivingScreen } from '../src/components/LivingScreen';
import { ProgressBar } from '../src/components/ProgressBar';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { SectionHeader } from '../src/components/SectionHeader';
import { Surface } from '../src/components/Surface';
import { Typography } from '../src/components/Typography';
import { useApp } from '../src/state/AppProvider';
import { colors, radii, spacing } from '../src/theme/tokens';
import { formatQuestDate } from '../src/utils/format';

export default function RewardsScreen() {
  const router = useRouter();
  const { profile, rewards, rewardLedger, quests, selectCosmetic, applyBoost, unlockCosmetic, useStreakProtection: consumeStreakProtection } = useApp();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmCosmeticId, setConfirmCosmeticId] = useState<string | null>(null);
  const eligibleMiss = quests.find((quest) => quest.status === 'missed');
  const pendingCosmetic = rewards.cosmetics.find((cosmetic) => cosmetic.id === confirmCosmeticId);
  const act = async (id: string, action: () => Promise<string | null>, success: string) => {
    setPendingId(id);
    setMessage(null);
    const result = await action();
    setPendingId(null);
    setMessage(result ?? success);
  };

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
      <Surface padding="large" style={styles.guard}>
        <View style={styles.guardHeader}><ShieldCheck size={24} color={colors.waterDeep} /><View style={styles.copy}><Typography variant="heading">Streak protection</Typography><Typography variant="body" color={colors.inkSecondary}>{eligibleMiss ? `Use one guard on the missed ${eligibleMiss.title} occurrence.` : 'Reserve one guard for the next eligible missed habit.'} It protects the streak only; it grants no XP, rubies, completion, or boss damage.</Typography></View></View>
        <View style={styles.guardAction}><Button label={eligibleMiss ? "Protect this miss" : "Reserve guard"} compact variant="secondary" disabled={rewards.streakProtection < 1} loading={pendingId === 'guard'} onPress={() => act('guard', () => consumeStreakProtection(eligibleMiss?.id), eligibleMiss ? 'The eligible miss is protected without changing its status.' : 'One streak guard is reserved.')} /></View>
      </Surface>
      <SectionHeader title="Boosts" description="Helpful advantages that never complete work for you" />
      {rewards.boosts.length === 0 ? <EmptyState icon={Zap} title="No boosts in inventory" message="Eligible milestone rewards will appear here when confirmed." /> : null}
      {rewards.boosts.map((boost) => (
        <Surface key={boost.id} padding="medium" style={styles.row}>
          <View style={styles.itemIcon}><Zap size={19} color={colors.coral} /></View>
          <View style={styles.copy}><Typography variant="label">{boost.name}</Typography><Typography variant="micro" color={colors.inkSecondary}>{boost.description}</Typography>{rewards.activeBoostId === boost.id ? <Chip label="Prepared for next eligible quest" selected tone="water" /> : null}</View>
          <View style={styles.action}><Chip label={`×${boost.quantity}`} tone="coral" /><Button label="Prepare" compact variant="secondary" disabled={boost.quantity < 1 || rewards.activeBoostId === boost.id} loading={pendingId === boost.id} onPress={() => act(boost.id, () => applyBoost(boost.id), `${boost.name} is prepared.`)} /></View>
        </Surface>
      ))}
      <SectionHeader title="Cosmetics" description="Appearance only—rubies never buy progress" />
      {rewards.cosmetics.length === 0 ? <EmptyState icon={Sparkles} title="No cosmetics yet" message="Earned and ruby-unlockable appearance rewards will appear here." /> : null}
      {rewards.cosmetics.map((cosmetic) => (
        <Surface key={cosmetic.id} padding="medium" style={[styles.row, !cosmetic.unlocked && styles.locked]}>
          <View style={styles.itemIcon}><Sparkles size={19} color={cosmetic.unlocked ? colors.sun : colors.inkSecondary} /></View>
          <View style={styles.copy}><Typography variant="label">{cosmetic.name}</Typography><Typography variant="micro" color={colors.inkSecondary}>{cosmetic.description}</Typography></View>
          {cosmetic.selected ? <Chip label="Wearing" selected tone="water" /> : cosmetic.unlocked ? <Button label="Wear" compact variant="secondary" onPress={() => selectCosmetic(cosmetic.id)} /> : <Button label={`Unlock · ${cosmetic.rubyPrice ?? 0}`} compact variant="secondary" loading={pendingId === cosmetic.id} disabled={rewards.rubies < (cosmetic.rubyPrice ?? 0)} onPress={() => setConfirmCosmeticId(cosmetic.id)} />}
        </Surface>
      ))}
      {pendingCosmetic ? <Surface tone="ink" padding="large" style={styles.confirm}><Typography variant="heading" color={colors.white}>Unlock {pendingCosmetic.name}?</Typography><Typography variant="body" color="rgba(255,255,255,0.72)">{pendingCosmetic.rubyPrice ?? 0} rubies will be spent on appearance only. XP, streaks, roadmap progress, and boss health will not change.</Typography><View style={styles.confirmActions}><Button label="Keep rubies" compact variant="ghost" onPress={() => setConfirmCosmeticId(null)} /><Button label={`Spend ${pendingCosmetic.rubyPrice ?? 0} rubies`} compact onPress={async () => { const id = pendingCosmetic.id; const name = pendingCosmetic.name; setConfirmCosmeticId(null); await act(id, () => unlockCosmetic(id), `${name} unlocked.`); }} /></View></Surface> : null}
      {message ? <Typography variant="body" color={message.includes('not ') || message.includes('enough') ? colors.coralText : colors.success}>{message}</Typography> : null}
      <SectionHeader title="Reward ledger" description="Every confirmed earn, spend, and inventory action" />
      <View style={styles.ledger}>
        {rewardLedger.length === 0 ? <EmptyState icon={History} title="No reward history yet" message="Confirmed earns, spends, and inventory actions will be traceable here." /> : null}
        {rewardLedger.map((entry) => (
          <Surface key={entry.id} padding="medium" style={styles.ledgerRow}>
            <History size={18} color={colors.waterDeep} />
            <View style={styles.copy}><Typography variant="label">{entry.title}</Typography><Typography variant="micro" color={colors.inkSecondary}>{formatQuestDate(entry.createdAt)}</Typography></View>
            <Typography variant="micro" color={entry.rubies < 0 ? colors.coralText : colors.success}>{entry.xp ? `+${entry.xp} XP ` : ''}{entry.rubies ? `${entry.rubies > 0 ? '+' : ''}${entry.rubies} rubies` : 'Inventory'}</Typography>
          </Surface>
        ))}
      </View>
    </LivingScreen>
  );
}

const styles = StyleSheet.create({
  level: { gap: spacing.sm },
  levelTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  balances: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  balance: { flex: 1, minWidth: 104, gap: 3 },
  guard: { gap: spacing.md },
  guardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  guardAction: { alignItems: 'flex-start' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  itemIcon: { width: 42, height: 42, borderRadius: radii.md, backgroundColor: colors.sky, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 3 },
  action: { alignItems: 'flex-end', gap: spacing.xs },
  locked: { borderStyle: 'dashed' },
  ledger: { gap: spacing.xs },
  ledgerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  confirm: { gap: spacing.sm },
  confirmActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
