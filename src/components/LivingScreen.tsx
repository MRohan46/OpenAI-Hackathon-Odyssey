import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, layout, spacing } from '../theme/tokens';
import { WorldBackdrop } from '../world/WorldBackdrop';

interface LivingScreenProps extends React.PropsWithChildren {
  immersive?: boolean;
  accent?: string;
  dim?: number;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  testID?: string;
}

export function LivingScreen({
  children,
  immersive = false,
  accent,
  dim,
  scroll = true,
  contentStyle,
  testID,
}: LivingScreenProps) {
  const content = <View style={[styles.content, contentStyle]}>{children}</View>;
  return (
    <View style={styles.root} testID={testID}>
      <WorldBackdrop immersive={immersive} accent={accent} dim={dim} />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {scroll ? (
            <ScrollView
              style={styles.safe}
              contentContainerStyle={styles.scroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {content}
            </ScrollView>
          ) : content}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand },
  safe: { flex: 1, zIndex: 1 },
  scroll: { flexGrow: 1, alignItems: 'center' },
  content: {
    width: '100%',
    maxWidth: layout.contentMax,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 116,
    gap: spacing.lg,
  },
});
