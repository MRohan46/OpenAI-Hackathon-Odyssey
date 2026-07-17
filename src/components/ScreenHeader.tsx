import { useRouter } from 'expo-router';
import { ArrowLeft, Bell } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useApp } from '../state/AppProvider';
import { colors, layout, radii, spacing } from '../theme/tokens';
import { Typography } from './Typography';

interface ScreenHeaderProps {
  title?: string;
  back?: boolean;
  eyebrow?: string;
  showNotifications?: boolean;
}

export function ScreenHeader({ title, back = false, eyebrow, showNotifications = false }: ScreenHeaderProps) {
  const router = useRouter();
  const { notifications } = useApp();
  const unread = notifications.filter((item) => !item.read).length;
  return (
    <View style={styles.row}>
      {back ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <ArrowLeft size={22} color={colors.ink} />
        </Pressable>
      ) : null}
      <View style={styles.copy}>
        {eyebrow ? (
          <Typography variant="micro" color={colors.inkSecondary}>
            {eyebrow.toUpperCase()}
          </Typography>
        ) : null}
        {title ? <Typography variant="heading">{title}</Typography> : null}
      </View>
      {showNotifications ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${unread} unread notifications`}
          onPress={() => router.push('/notifications')}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <Bell size={21} color={colors.ink} />
          {unread > 0 ? <View style={styles.badge} /> : null}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: layout.touchTarget, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  copy: { flex: 1 },
  iconButton: {
    width: layout.touchTarget,
    height: layout.touchTarget,
    borderRadius: radii.pill,
    backgroundColor: colors.mistStrong,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    right: 9,
    top: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.coral,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  pressed: { opacity: 0.72 },
});
