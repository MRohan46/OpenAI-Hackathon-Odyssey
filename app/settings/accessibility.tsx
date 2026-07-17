import { Eye, Gauge, Hand, Waves } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ChoiceGroup } from '../../src/components/ChoiceGroup';
import { LivingScreen } from '../../src/components/LivingScreen';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Surface } from '../../src/components/Surface';
import { SwitchRow } from '../../src/components/SwitchRow';
import { Typography } from '../../src/components/Typography';
import { useApp } from '../../src/state/AppProvider';
import { colors, radii, spacing } from '../../src/theme/tokens';

export default function AccessibilityScreen() {
  const { preferences, updatePreferences } = useApp();
  return (
    <LivingScreen dim={0.24}>
      <ScreenHeader back title="Accessibility" eyebrow="The journey adapts" />
      <Surface tone="ink" padding="large" style={styles.intro}><Waves size={26} color={colors.sun} /><Typography variant="heading" color={colors.white}>Motion is atmosphere, never navigation.</Typography><Typography variant="body" color="rgba(255,255,255,0.72)">Every route and action remains available when the living world is still.</Typography></Surface>
      <Surface padding="large" style={styles.group}>
        <View style={styles.label}><View style={styles.icon}><Waves size={19} color={colors.waterDeep} /></View><Typography variant="heading">Motion</Typography></View>
        <ChoiceGroup label="Reduced motion" value={preferences.reducedMotionOverride} options={['system', 'on', 'off'] as const} labels={{ system: 'Follow device', on: 'Reduce motion', off: 'Full motion' }} onChange={(value) => updatePreferences({ reducedMotionOverride: value })} />
      </Surface>
      <Surface padding="large" style={styles.group}>
        <View style={styles.label}><View style={styles.icon}><Gauge size={19} color={colors.waterDeep} /></View><Typography variant="heading">Graphics</Typography></View>
        <ChoiceGroup label="Living Shore quality" value={preferences.graphicsQuality} options={['auto', 'full', 'balanced', 'calm'] as const} onChange={(value) => updatePreferences({ graphicsQuality: value })} />
        <Typography variant="micro" color={colors.inkSecondary}>Calm keeps the generated shore poster and removes expensive real-time depth.</Typography>
      </Surface>
      <Surface padding="large" style={styles.switches}>
        <View style={styles.label}><View style={styles.icon}><Hand size={19} color={colors.waterDeep} /></View><Typography variant="heading">Touch and contrast</Typography></View>
        <SwitchRow label="Haptic feedback" description="Gentle confirmation on deliberate actions." value={preferences.haptics} onValueChange={(value) => updatePreferences({ haptics: value })} />
        <SwitchRow label="High contrast" description="Strengthen boundaries and foreground contrast." value={preferences.highContrast} onValueChange={(value) => updatePreferences({ highContrast: value })} />
      </Surface>
      <View style={styles.note}><Eye size={18} color={colors.waterDeep} /><Typography variant="micro" color={colors.inkSecondary}>Screen-reader labels, 48-point controls, and readable text remain part of every mode.</Typography></View>
    </LivingScreen>
  );
}
const styles = StyleSheet.create({ intro: { gap: spacing.sm }, group: { gap: spacing.lg }, switches: { gap: spacing.sm }, label: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, icon: { width: 40, height: 40, borderRadius: radii.md, backgroundColor: colors.sky, alignItems: 'center', justifyContent: 'center' }, note: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs } });
