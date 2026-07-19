import { Image } from 'expo-image';
import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotion } from '../hooks/useReducedMotion';

const thunderGavel = require('../../assets/images/first-island/thunder-gavel.png');
const thunderImpact = require('../../assets/images/first-island/thunder-impact.png');
const deepMist = require('../../assets/images/first-island/deep-mist-veil.png');

export function FirstIslandCinematicIntro() {
  const { width } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const desktop = width >= 900;
  const progress = useSharedValue(reducedMotion ? 1 : 0);
  const lightning = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      progress.value = 1;
      lightning.value = 0;
      return;
    }

    progress.value = 0;
    lightning.value = 0;
    const steps: [delay: number, value: number, duration: number][] = [
      [620, 0.18, 220],
      [1080, 0.29, 320],
      [1480, 0.39, 300],
      [1860, 0.49, 290],
      [2190, 0.58, 250],
      [2440, 0.62, 180],
      [2980, 0.69, 110],
      [3130, 0.74, 120],
      [3500, 0.82, 440],
      [4050, 0.9, 520],
      [4700, 1, 620],
    ];
    const timers = steps.map(([delay, value, duration]) =>
      setTimeout(() => {
        progress.value = withTiming(value, { duration, easing: Easing.inOut(Easing.cubic) });
      }, delay),
    );
    const lightningSteps: [delay: number, value: number, duration: number][] = [
      [2390, 1, 55],
      [2490, 0.16, 55],
      [2580, 1, 55],
      [2690, 0.22, 55],
      [2790, 1, 55],
      [2920, 0.72, 70],
      [3070, 0, 100],
    ];
    const lightningTimers = lightningSteps.map(([delay, value, duration]) =>
      setTimeout(() => {
        lightning.value = withTiming(value, { duration, easing: Easing.linear });
      }, delay),
    );

    return () => [...timers, ...lightningTimers].forEach(clearTimeout);
  }, [lightning, progress, reducedMotion]);

  const deepFogStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.72, 0.83, 1], [1, 1, 0.46, 0]),
    transform: [
      { scale: interpolate(progress.value, [0, 0.64, 1], [1.12, 1.04, 1.2]) },
      { translateY: interpolate(progress.value, [0, 0.64, 1], [0, -8, 74]) },
    ],
  }));

  const hammerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0, 0.14, 0.18, 0.66, 0.74, 1],
      [0, 0, 1, 1, 0, 0],
    ),
    transform: [
      {
        translateY: interpolate(
          progress.value,
          [0, 0.18, 0.29, 0.39, 0.49, 0.58, 0.66, 1],
          [34, 22, -58, 28, -42, 18, 6, 6],
        ),
      },
      {
        rotateZ: `${interpolate(
          progress.value,
          [0, 0.18, 0.29, 0.39, 0.49, 0.58, 0.66, 1],
          [-16, -16, 24, -23, 18, -17, -9, -9],
        )}deg`,
      },
      { scale: interpolate(progress.value, [0, 0.18, 0.3, 0.66, 1], [0.72, 0.82, 1, 1.05, 1.05]) },
    ],
  }));

  const lightningStyle = useAnimatedStyle(() => ({
    opacity: lightning.value,
    transform: [
      { scale: interpolate(progress.value, [0, 0.49, 0.52, 0.66, 1], [0.34, 0.34, 0.94, 1.24, 1.24]) },
      { rotateZ: `${interpolate(progress.value, [0, 0.49, 0.66, 1], [-8, -8, 6, 6])}deg` },
    ],
  }));

  const impactFlashStyle = useAnimatedStyle(() => ({
    opacity: interpolate(lightning.value, [0, 1], [0, 0.56]),
  }));

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      nativeID={reducedMotion ? 'cinematic-reduced' : 'cinematic-full'}
      pointerEvents="none"
      style={styles.root}
      testID="first-island-cinematic-intro"
    >
      <Animated.View testID="cinematic-deep-fog" style={[StyleSheet.absoluteFill, styles.deepFog, deepFogStyle]}>
        <Image
          accessible={false}
          alt=""
          accessibilityLabel=""
          source={deepMist}
          contentFit="cover"
          contentPosition="center"
          cachePolicy="memory-disk"
          priority="high"
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.fogDepth} />
      </Animated.View>

      <Animated.View testID="cinematic-impact-flash" style={[StyleSheet.absoluteFill, styles.impactFlash, impactFlashStyle]} />

      <Animated.View
        testID="cinematic-lightning"
        style={[
          styles.lightning,
          desktop ? styles.lightningDesktop : styles.lightningMobile,
          lightningStyle,
        ]}
      >
        <Image
          accessible={false}
          alt=""
          accessibilityLabel=""
          source={thunderImpact}
          contentFit="contain"
          cachePolicy="memory-disk"
          priority="high"
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View
        testID="cinematic-hammer"
        style={[
          styles.hammer,
          desktop ? styles.hammerDesktop : styles.hammerMobile,
          hammerStyle,
        ]}
      >
        <Image
          accessible={false}
          alt=""
          accessibilityLabel=""
          source={thunderGavel}
          contentFit="contain"
          cachePolicy="memory-disk"
          priority="high"
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 30, overflow: 'hidden' },
  deepFog: { backgroundColor: '#D7EBED' },
  fogDepth: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(5, 25, 52, 0.26)' },
  impactFlash: { backgroundColor: '#DFFBFF' },
  hammer: { position: 'absolute', alignSelf: 'center', left: '50%', top: '50%' },
  hammerMobile: { width: 350, height: 280, marginLeft: -175, marginTop: -178 },
  hammerDesktop: { width: 720, height: 470, marginLeft: -360, marginTop: -286 },
  lightning: { position: 'absolute', alignSelf: 'center', left: '50%', top: '50%' },
  lightningMobile: { width: 430, height: 430, marginLeft: -215, marginTop: -250 },
  lightningDesktop: { width: 940, height: 690, marginLeft: -470, marginTop: -390 },
});
