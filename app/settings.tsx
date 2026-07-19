import { useRouter } from 'expo-router';
import { Bell, ChevronRight, Eye, LockKeyhole, LogOut, SlidersHorizontal } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '../src/components/Button';
import { LivingScreen } from '../src/components/LivingScreen';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { Surface } from '../src/components/Surface';
import { Typography } from '../src/components/Typography';
import { useApp } from '../src/state/AppProvider';
import { colors, radii, spacing } from '../src/theme/tokens';

const rows = [
  { title: 'Reminders', description: 'Upcoming, deadline, and overdue presentation', icon: Bell, route: '/settings/reminders' as const },
  { title: 'Accessibility and motion', description: 'Reduced motion, haptics, contrast, and graphics', icon: Eye, route: '/settings/accessibility' as const },
  { title: 'Privacy and trust', description: 'Ownership, proof, AI authority, and endpoint status', icon: LockKeyhole, route: '/settings/privacy' as const },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { profile, signOut } = useApp();
  const [signingOut, setSigningOut] = useState(false);
  const leaveOdyssey = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
      router.replace('/welcome');
    }
  };
  return (
    <LivingScreen dim={0.28}>
      <ScreenHeader back title="Settings" eyebrow="Make the shore yours" />
      <Surface padding="large" style={styles.account}><View style={styles.avatar}><SlidersHorizontal size={24} color={colors.waterDeep} /></View><View style={styles.copy}><Typography variant="heading">{profile.name}</Typography><Typography variant="body" color={colors.inkSecondary}>{profile.handle}</Typography></View></Surface>
      <View style={styles.stack}>
        {rows.map((row) => <Surface key={row.title} onPress={() => router.push(row.route)} accessibilityLabel={`Open ${row.title}`} padding="medium" style={styles.row}><View style={styles.icon}><row.icon size={20} color={colors.ink} /></View><View style={styles.copy}><Typography variant="label">{row.title}</Typography><Typography variant="micro" color={colors.inkSecondary}>{row.description}</Typography></View><ChevronRight size={19} color={colors.inkSecondary} /></Surface>)}
      </View>
      <Button label="Sign out" icon={LogOut} variant="ghost" onPress={leaveOdyssey} loading={signingOut} accessibilityHint="Clears this device's Odyssey session and returns to the welcome screen" />
      <Typography variant="micro" color={colors.inkSecondary} style={styles.center}>Frontend settings use the replaceable profile endpoint contract. Teammate-owned backend policies remain outside this repository.</Typography>
    </LivingScreen>
  );
}
const styles = StyleSheet.create({ account: { flexDirection: 'row', alignItems: 'center', gap: spacing.md }, avatar: { width: 50, height: 50, borderRadius: radii.pill, backgroundColor: colors.sky, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, gap: 2 }, stack: { gap: spacing.sm }, row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, icon: { width: 42, height: 42, borderRadius: radii.md, backgroundColor: colors.sand, alignItems: 'center', justifyContent: 'center' }, center: { textAlign: 'center' } });
