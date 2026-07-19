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

import { useReducedMotion } from '../hooks/useReducedMotion';
import { FirstIslandScene } from './FirstIslandScene';

const archipelago = require('../../assets/images/tide-observatory/coastal-route-background.png');

export function FirstIslandBackdrop() {
  const reducedMotion = useReducedMotion();
  const drift = useSharedValue(0);
  const breathe = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      drift.value = 0;
      breathe.value = 0;
      return;
    }
    drift.value = withRepeat(
      withTiming(1, { duration: 18000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    breathe.value = withRepeat(
      withTiming(1, { duration: 6800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [breathe, drift, reducedMotion]);

  const imageMotion = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(drift.value, [0, 1], [1.035, 1.085]) },
      { translateX: interpolate(drift.value, [0, 1], [-5, 5]) },
      { translateY: interpolate(drift.value, [0, 1], [2, -8]) },
    ],
  }));

  const horizonMotion = useAnimatedStyle(() => ({
    opacity: interpolate(breathe.value, [0, 0.5, 1], [0.18, 0.34, 0.18]),
    transform: [{ scale: interpolate(breathe.value, [0, 1], [0.96, 1.08]) }],
  }));

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, styles.nonInteractive]}
      testID="first-island-backdrop"
    >
      <Animated.View style={[StyleSheet.absoluteFill, imageMotion]}>
        <Image
          accessible={false}
          alt=""
          accessibilityLabel=""
          source={archipelago}
          contentFit="cover"
          contentPosition={{ top: '44%', left: '62%' }}
          cachePolicy="memory-disk"
          priority="high"
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <View style={styles.blueDepth} />
      <Animated.View style={[styles.horizonBloom, horizonMotion]} />
      <View style={styles.centerVeil} />
      <View style={styles.bottomVeil} />
      <View style={styles.scene}>
        <FirstIslandScene reducedMotion={reducedMotion} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nonInteractive: { pointerEvents: 'none' },
  scene: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 4 },
  blueDepth: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 63, 108, 0.18)',
    zIndex: 1,
  },
  centerVeil: {
    position: 'absolute',
    top: '7%',
    left: '12%',
    right: '12%',
    height: '54%',
    borderRadius: 999,
    backgroundColor: 'rgba(230, 252, 255, 0.14)',
    zIndex: 2,
  },
  horizonBloom: {
    position: 'absolute',
    top: '4%',
    right: '-14%',
    width: '58%',
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 238, 179, 0.44)',
    zIndex: 2,
  },
  bottomVeil: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '33%',
    backgroundColor: 'rgba(4, 37, 72, 0.44)',
    borderTopColor: 'rgba(255, 255, 255, 0.18)',
    borderTopWidth: 1,
    zIndex: 3,
  },
});
