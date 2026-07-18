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

interface TideObservatoryBackdropProps {
  reducedMotion: boolean;
  highContrast?: boolean;
  compact?: boolean;
}

const background = require('../../assets/images/tide-observatory/coastal-route-scroll-background.png');
const activeIsland = require('../../assets/images/tide-observatory/active-sun-island.png');
const tideGlint = require('../../assets/images/tide-observatory/tide-glint.png');

export function TideObservatoryBackdrop({ reducedMotion, highContrast = false, compact = false }: TideObservatoryBackdropProps) {
  const drift = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      drift.value = 0;
      pulse.value = 0;
      return;
    }

    drift.value = withRepeat(
      withTiming(1, { duration: 12000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    pulse.value = withRepeat(
      withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [drift, pulse, reducedMotion]);

  const backgroundMotion = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(drift.value, [0, 1], [1.01, 1.027]) },
      { translateX: interpolate(drift.value, [0, 1], [0, -2.5]) },
      { translateY: interpolate(drift.value, [0, 1], [0, -3.5]) },
    ],
  }));

  const islandMotion = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(pulse.value, [0, 1], [1.5, -2.5]) },
      { scale: interpolate(pulse.value, [0, 1], [0.985, 1.018]) },
    ],
  }));

  const glintMotion = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 0.5, 1], [0.28, 0.58, 0.28]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.92, 1.08]) }],
  }));

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, styles.nonInteractive]}
      testID="tide-observatory-backdrop"
    >
      <Animated.View style={[StyleSheet.absoluteFill, backgroundMotion]}>
        <Image
          accessible={false}
          alt=""
          accessibilityLabel=""
          source={background}
          contentFit={compact ? 'fill' : 'cover'}
          contentPosition={{ top: '50%', left: '75%' }}
          cachePolicy="memory-disk"
          priority="high"
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View style={[styles.glint, compact && styles.glintCompact, glintMotion]}>
        <Image accessible={false} alt="" accessibilityLabel="" source={tideGlint} contentFit="contain" cachePolicy="memory-disk" priority="high" style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={[styles.activeIsland, compact && styles.activeIslandCompact, islandMotion]}>
        <Image accessible={false} alt="" accessibilityLabel="" source={activeIsland} contentFit="contain" cachePolicy="memory-disk" priority="high" style={StyleSheet.absoluteFill} />
      </Animated.View>
      <View style={[styles.skyWash, highContrast && styles.skyWashHighContrast]} />
    </View>
  );
}

const styles = StyleSheet.create({
  nonInteractive: { pointerEvents: 'none' },
  activeIsland: {
    position: 'absolute',
    left: '18%',
    top: 520,
    width: '29%',
    aspectRatio: 1,
  },
  activeIslandCompact: { left: '31%' },
  glint: {
    position: 'absolute',
    left: '13%',
    top: 500,
    width: '40%',
    aspectRatio: 1,
  },
  glintCompact: { left: '23%' },
  skyWash: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 220,
    backgroundColor: 'rgba(223, 245, 255, 0.12)',
  },
  skyWashHighContrast: { backgroundColor: 'rgba(255, 255, 255, 0.28)' },
});
