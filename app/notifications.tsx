import { Bell, CheckCheck, Clock3, Gem, TriangleAlert } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '../src/components/EmptyState';
import { LivingScreen } from '../src/components/LivingScreen';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { Surface } from '../src/components/Surface';
import { Typography } from '../src/components/Typography';
import { useApp } from '../src/state/AppProvider';
import { colors, radii, spacing } from '../src/theme/tokens';
import { formatQuestDate } from '../src/utils/format';

const icons = { scheduled: Clock3, deadline: Bell, overdue: TriangleAlert, reward: Gem } as const;

export default function NotificationsScreen() {
  const { notifications, markNotificationRead } = useApp();
  return (
    <LivingScreen dim={0.28}>
      <ScreenHeader back title="Tide notes" eyebrow="In-app reminders" />
      <Typography variant="body" color={colors.inkSecondary}>Clear timing first, theme second. Every reminder tells you what needs attention and when.</Typography>
      {notifications.length === 0 ? <EmptyState icon={Bell} title="The shore is quiet." message="New reminders and confirmed rewards will appear here." /> : (
        <View style={styles.stack}>
          {notifications.map((notification) => {
            const Icon = icons[notification.kind];
            return (
              <Surface key={notification.id} onPress={() => markNotificationRead(notification.id)} accessibilityLabel={`${notification.read ? 'Read' : 'Unread'} notification: ${notification.title}`} padding="medium" style={!notification.read ? styles.unread : undefined}>
                <View style={styles.row}>
                  <View style={[styles.icon, { backgroundColor: notification.kind === 'overdue' ? 'rgba(255,113,91,0.14)' : colors.sky }]}><Icon size={19} color={notification.kind === 'overdue' ? colors.coral : colors.waterDeep} /></View>
                  <View style={styles.copy}><View style={styles.titleRow}><Typography variant="label">{notification.title}</Typography>{notification.read ? <CheckCheck size={16} color={colors.success} /> : <View style={styles.dot} />}</View><Typography variant="body" color={colors.inkSecondary}>{notification.body}</Typography><Typography variant="micro" color={colors.inkSecondary}>{formatQuestDate(notification.createdAt)}</Typography></View>
                </View>
              </Surface>
            );
          })}
        </View>
      )}
    </LivingScreen>
  );
}
const styles = StyleSheet.create({
  stack: { gap: spacing.sm }, unread: { borderColor: colors.water, borderWidth: 2 }, row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  icon: { width: 42, height: 42, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, gap: 4 }, titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }, dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.coral },
});
