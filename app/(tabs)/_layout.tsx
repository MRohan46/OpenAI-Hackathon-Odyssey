import { Tabs } from 'expo-router';
import { CalendarDays, Map, Sunrise, UserRound, type LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Typography } from '../../src/components/Typography';
import { colors, fontFamilies, radii, shadows } from '../../src/theme/tokens';

const tabs = {
  today: { icon: Sunrise, label: 'Today' },
  journey: { icon: Map, label: 'Journey' },
  calendar: { icon: CalendarDays, label: 'Calendar' },
  profile: { icon: UserRound, label: 'Profile' },
} as const;

function TabGlyph({ Icon, label, focused }: { Icon: LucideIcon; label: string; focused: boolean }) {
  return (
    <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.glyph}>
      <Icon size={23} color={focused ? colors.ink : colors.inkSecondary} strokeWidth={focused ? 2.35 : 1.9} />
      <Typography
        variant="micro"
        color={focused ? colors.ink : colors.inkSecondary}
        style={[styles.glyphLabel, focused && styles.glyphLabelActive]}
      >
        {label}
      </Typography>
      <View style={[styles.indicator, focused && styles.indicatorActive]} />
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const tabHeight = 68 + Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={({ route }) => {
        const config = tabs[route.name as keyof typeof tabs] ?? tabs.today;
        return {
          headerShown: false,
          tabBarShowLabel: false,
          tabBarHideOnKeyboard: true,
          tabBarIcon: ({ focused }) => <TabGlyph Icon={config.icon} label={config.label} focused={focused} />,
          tabBarActiveTintColor: colors.ink,
          tabBarInactiveTintColor: colors.inkSecondary,
          tabBarItemStyle: { height: tabHeight - Math.max(insets.bottom, 8) },
          tabBarStyle: {
            position: 'absolute',
            left: 14,
            right: 14,
            bottom: 10,
            height: tabHeight,
            paddingTop: 5,
            paddingBottom: Math.max(insets.bottom, 8),
            backgroundColor: 'rgba(255, 255, 255, 0.94)',
            borderTopWidth: 0,
            borderRadius: radii.lg,
            overflow: 'hidden',
            ...shadows,
          },
        };
      }}
    >
      <Tabs.Screen name="today" options={{ title: 'Today', tabBarAccessibilityLabel: 'Today' }} />
      <Tabs.Screen name="journey" options={{ title: 'Journey', tabBarAccessibilityLabel: 'Journey' }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendar', tabBarAccessibilityLabel: 'Calendar' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarAccessibilityLabel: 'Profile' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  glyph: { minWidth: 64, height: 56, alignItems: 'center', justifyContent: 'center', gap: 2 },
  glyphLabel: { fontFamily: fontFamilies.bodyMedium, fontSize: 10.5, lineHeight: 13 },
  glyphLabelActive: { fontFamily: fontFamilies.bodyBold },
  indicator: { width: 28, height: 3, borderRadius: radii.pill, backgroundColor: colors.transparent },
  indicatorActive: { backgroundColor: colors.sun },
});
