import { Bot, CheckCircle2, CloudOff, Database, Image, KeyRound, LockKeyhole, UserRound } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Chip } from '../../src/components/Chip';
import { LivingScreen } from '../../src/components/LivingScreen';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Surface } from '../../src/components/Surface';
import { Typography } from '../../src/components/Typography';
import { endpoints, isLiveApiConfigured } from '../../src/api';
import { colors, radii, spacing } from '../../src/theme/tokens';

const trustRows = [
  { icon: UserRound, title: 'Your journeys belong to you', body: 'Goals, completion history, rewards, and analytics are scoped to the signed-in owner.' },
  { icon: Image, title: 'Proof is private evidence', body: 'Photo proof belongs to one completion record. It is not a social post or an automatic truth verdict.' },
  { icon: Bot, title: 'AI proposes; you decide', body: 'Generated roadmaps remain editable proposals until you explicitly accept them.' },
  { icon: KeyRound, title: 'Secrets stay behind the server', body: 'No Supabase service key or Groq credential is embedded in this Expo client.' },
];

export default function PrivacyScreen() {
  return (
    <LivingScreen dim={0.28}>
      <ScreenHeader back title="Privacy and trust" eyebrow="Plain language" />
      <Surface tone="ink" padding="large" style={styles.hero}><LockKeyhole size={28} color={colors.sun} /><Typography variant="title" color={colors.white}>A private journey should stay private.</Typography><Typography variant="body" color="rgba(255,255,255,0.72)">The interface shows the promises the backend must enforce. It does not pretend frontend copy is a security boundary.</Typography></Surface>
      <View style={styles.stack}>
        {trustRows.map((row) => <Surface key={row.title} padding="medium" style={styles.row}><View style={styles.icon}><row.icon size={20} color={colors.waterDeep} /></View><View style={styles.copy}><Typography variant="label">{row.title}</Typography><Typography variant="body" color={colors.inkSecondary}>{row.body}</Typography></View></Surface>)}
      </View>
      <Surface padding="large" style={styles.endpoint}>
        <View style={styles.endpointTop}>{isLiveApiConfigured ? <Database size={22} color={colors.success} /> : <CloudOff size={22} color={colors.coral} />}<View style={styles.copy}><Typography variant="heading">Endpoint mode</Typography><Typography variant="body" color={colors.inkSecondary}>{isLiveApiConfigured ? 'Live API base URL configured.' : 'Presentation mock adapter active. No backend URL is configured.'}</Typography></View><Chip label={isLiveApiConfigured ? 'Live contract' : 'Mock contract'} tone={isLiveApiConfigured ? 'success' : 'coral'} /></View>
        <View style={styles.path}><CheckCircle2 size={16} color={colors.success} /><Typography variant="micro">Open example: {endpoints.questComplete(':questId')}</Typography></View>
        <Typography variant="micro" color={colors.inkSecondary}>Private AI requests go through Odyssey&apos;s authenticated Vercel API. Supabase row-level policies still protect account data.</Typography>
      </Surface>
    </LivingScreen>
  );
}
const styles = StyleSheet.create({ hero: { gap: spacing.sm }, stack: { gap: spacing.sm }, row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }, icon: { width: 42, height: 42, borderRadius: radii.md, backgroundColor: colors.sky, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, gap: 3 }, endpoint: { gap: spacing.md }, endpointTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, path: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs } });
