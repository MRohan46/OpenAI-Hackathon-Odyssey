import { Bell, BellOff, Clock3 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { Button } from '../../src/components/Button';
import { ChoiceGroup } from '../../src/components/ChoiceGroup';
import { LivingScreen } from '../../src/components/LivingScreen';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Surface } from '../../src/components/Surface';
import { SwitchRow } from '../../src/components/SwitchRow';
import { Typography } from '../../src/components/Typography';
import { useApp } from '../../src/state/AppProvider';
import { colors, radii, spacing } from '../../src/theme/tokens';

type Permission = 'unknown' | 'allowed' | 'denied';

export default function ReminderSettingsScreen() {
  const { preferences, updatePreferences } = useApp();
  const [permission, setPermission] = useState<Permission>('unknown');
  useEffect(() => {
    if (Platform.OS === 'web') return;
    import('expo-notifications')
      .then((notifications) => notifications.getPermissionsAsync())
      .then((result) => setPermission(result.granted ? 'allowed' : result.canAskAgain ? 'unknown' : 'denied'))
      .catch(() => setPermission('unknown'));
  }, []);
  const ask = async () => {
    if (Platform.OS === 'web') return setPermission('denied');
    const notifications = await import('expo-notifications');
    const result = await notifications.requestPermissionsAsync();
    setPermission(result.granted ? 'allowed' : 'denied');
  };
  return (
    <LivingScreen dim={0.26}>
      <ScreenHeader back title="Reminders" eyebrow="Clear timing" />
      <Surface tone={permission === 'denied' ? 'sand' : 'ink'} padding="large" style={styles.permission}>
        <View style={[styles.icon, { backgroundColor: permission === 'allowed' ? 'rgba(24,184,200,0.18)' : 'rgba(255,113,91,0.14)' }]}>{permission === 'denied' ? <BellOff size={23} color={colors.coral} /> : <Bell size={23} color={permission === 'allowed' ? colors.water : colors.sun} />}</View>
        <View style={styles.copy}><Typography variant="heading" color={permission === 'denied' ? colors.ink : colors.white}>{permission === 'allowed' ? 'Device reminders allowed' : permission === 'denied' ? 'Device reminders denied' : 'Permission not decided'}</Typography><Typography variant="body" color={permission === 'denied' ? colors.inkSecondary : 'rgba(255,255,255,0.72)'}>{permission === 'allowed' ? 'Odyssey may present teammate-backed scheduled reminders.' : 'In-app tide notes still work. Device delivery requires OS permission and backend scheduling.'}</Typography></View>
        {permission === 'unknown' ? <Button label="Allow device reminders" variant="secondary" onPress={ask} /> : null}
      </Surface>
      <Surface padding="large" style={styles.switches}>
        <SwitchRow label="Quest starting soon" description="Before a scheduled occurrence begins." value={preferences.questReminders} onValueChange={(value) => updatePreferences({ questReminders: value })} />
        <SwitchRow label="Deadline approaching" description="When time remains but attention is needed." value={preferences.deadlineReminders} onValueChange={(value) => updatePreferences({ deadlineReminders: value })} />
        <SwitchRow label="Overdue recovery" description="A clear next action after a scheduled time passes." value={preferences.overdueReminders} onValueChange={(value) => updatePreferences({ overdueReminders: value })} />
      </Surface>
      <Surface padding="large" style={styles.lead}>
        <View style={styles.label}><Clock3 size={20} color={colors.waterDeep} /><Typography variant="heading">Lead time</Typography></View>
        <ChoiceGroup label="Before scheduled quests" value={String(preferences.reminderLeadMinutes)} options={['5', '15', '30', '60'] as const} labels={{ '5': '5 min', '15': '15 min', '30': '30 min', '60': '1 hour' }} onChange={(value) => updatePreferences({ reminderLeadMinutes: Number(value) })} />
      </Surface>
      <Typography variant="micro" color={colors.inkSecondary}>This frontend stores presentation preferences and exposes the notification endpoint contract. It does not schedule teammate-owned backend jobs.</Typography>
    </LivingScreen>
  );
}
const styles = StyleSheet.create({ permission: { gap: spacing.md }, icon: { width: 48, height: 48, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' }, copy: { gap: 3 }, switches: { gap: spacing.xs }, lead: { gap: spacing.lg }, label: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm } });
