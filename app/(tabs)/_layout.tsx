import { Tabs } from 'expo-router';
import { CalendarDays, Map, Sunrise, UserRound } from 'lucide-react-native';
import React from 'react';

import { colors, fontFamilies } from '../../src/theme/tokens';

const icons = { today: Sunrise, journey: Map, calendar: CalendarDays, profile: UserRound } as const;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => {
        const Icon = icons[route.name as keyof typeof icons] ?? Sunrise;
        return {
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Icon size={size} color={color} strokeWidth={2.1} />,
          tabBarActiveTintColor: colors.ink,
          tabBarInactiveTintColor: colors.inkSecondary,
          tabBarLabelStyle: { fontFamily: fontFamilies.bodySemiBold, fontSize: 11 },
          tabBarStyle: {
            position: 'absolute',
            height: 80,
            paddingTop: 8,
            paddingBottom: 14,
            backgroundColor: colors.sand,
            borderTopColor: colors.line,
          },
        };
      }}
    >
      <Tabs.Screen name="today" options={{ title: 'Today' }} />
      <Tabs.Screen name="journey" options={{ title: 'Journey' }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendar' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
