import { Image } from 'expo-image';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors, radii } from '../theme/tokens';

const roadTriptych = require('../../assets/images/quest-roadmap/coastal-road-triptych.webp');
const flameDragon = require('../../assets/images/quest-roadmap/dragon-flame.png');
const guideDragon = require('../../assets/images/quest-roadmap/dragon-guide.png');

interface InfiniteQuestRoadProps {
  height: number;
  panelHeight: number;
  questTops: number[];
  reducedMotion: boolean;
  compact?: boolean;
  highContrast?: boolean;
}

export function InfiniteQuestRoad({
  height,
  panelHeight,
  questTops,
  reducedMotion,
  compact = false,
  highContrast = false,
}: InfiniteQuestRoadProps) {
  const drift = useSharedValue(0);
  const cycleHeight = panelHeight * 3;
  const cycleCount = Math.ceil(height / cycleHeight);

  useEffect(() => {
    if (reducedMotion) {
      drift.value = 0;
      return;
    }

    drift.value = withRepeat(
      withTiming(1, { duration: 4200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [drift, reducedMotion]);

  const flameMotion = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(drift.value, [0, 1], [3, -5]) },
      { rotate: interpolate(drift.value, [0, 1], [-3, 2]) + 'deg' },
    ],
  }));
  const guideMotion = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(drift.value, [0, 1], [-2, 6]) },
      { rotate: interpolate(drift.value, [0, 1], [2, -2]) + 'deg' },
    ],
  }));

  const firstDecorationTop = (questTops[0] ?? 520) + (compact ? 236 : 260);
  const secondDecorationTop = (questTops[1] ?? firstDecorationTop + 390) + (compact ? 224 : 246);

  return (
    <View
      aria-hidden
      style={[StyleSheet.absoluteFill, styles.root]}
      testID="infinite-quest-road"
    >
      {Array.from({ length: cycleCount }, (_, index) => (
        <Image
          key={index}
          accessible={false}
          alt=""
          accessibilityLabel=""
          source={roadTriptych}
          contentFit="fill"
          cachePolicy="memory-disk"
          priority={index === 0 ? 'high' : 'normal'}
          style={[styles.panel, { height: cycleHeight + 2, top: index * cycleHeight - 1 }]}
          testID={`road-triptych-${index + 1}`}
        />
      ))}

      <Animated.View
        style={[
          styles.companion,
          styles.flameCompanion,
          compact && styles.companionCompact,
          { top: firstDecorationTop },
          flameMotion,
        ]}
        testID="flame-dragon-decoration"
      >
        <View style={styles.companionAura} />
        <Image source={flameDragon} contentFit="contain" cachePolicy="memory-disk" style={StyleSheet.absoluteFill} />
      </Animated.View>

      <Animated.View
        style={[
          styles.companion,
          styles.guideCompanion,
          compact && styles.companionCompact,
          { top: secondDecorationTop },
          guideMotion,
        ]}
        testID="guide-dragon-decoration"
      >
        <View style={styles.companionAura} />
        <Image source={guideDragon} contentFit="contain" cachePolicy="memory-disk" style={StyleSheet.absoluteFill} />
      </Animated.View>

      <View style={[styles.readabilityWash, highContrast && styles.readabilityWashHighContrast]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { overflow: 'hidden', backgroundColor: colors.sand, pointerEvents: 'none' },
  panel: { position: 'absolute', left: 0, right: 0, width: '100%' },
  companion: { position: 'absolute', zIndex: 2, width: 104, height: 104 },
  companionCompact: { width: 86, height: 86 },
  flameCompanion: { right: -8 },
  guideCompanion: { left: -5 },
  companionAura: {
    position: 'absolute',
    inset: 7,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.34)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
  },
  readabilityWash: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(255, 247, 225, 0.04)',
  },
  readabilityWashHighContrast: { backgroundColor: 'rgba(255,255,255,0.13)' },
});
