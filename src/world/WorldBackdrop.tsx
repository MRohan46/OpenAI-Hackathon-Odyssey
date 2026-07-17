import { useMachine } from '@xstate/react';
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
import { colors } from '../theme/tokens';
import { LivingShoreScene } from './LivingShoreScene';
import { shoreMotionMachine } from './shoreMotionMachine';

interface WorldBackdropProps {
  immersive?: boolean;
  accent?: string;
  dim?: number;
}

export function WorldBackdrop({ immersive = false, accent, dim = 0.12 }: WorldBackdropProps) {
  const reducedMotion = useReducedMotion();
  const [, send] = useMachine(shoreMotionMachine);
  const tide = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      send({ type: 'REDUCE' });
      tide.value = 0;
      return;
    }
    send({ type: 'RESTORE' });
    send({ type: 'GLIDE' });
    tide.value = withRepeat(withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [reducedMotion, send, tide]);

  const posterMotion = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(tide.value, [0, 1], [1.035, 1.085]) },
      { translateY: interpolate(tide.value, [0, 1], [0, -7]) },
    ],
  }));

  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[StyleSheet.absoluteFill, styles.nonInteractive]}>
      <Animated.View style={[StyleSheet.absoluteFill, posterMotion]}>
        <Image
          source={require('../../assets/images/living-shore-poster.png')}
          contentFit="cover"
          contentPosition="center"
          transition={300}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      {immersive ? <View style={styles.scene}><LivingShoreScene reducedMotion={reducedMotion} accent={accent} /></View> : null}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(255, 246, 229, ${dim})` }]} />
      <View style={styles.fade} />
    </View>
  );
}

const styles = StyleSheet.create({
  nonInteractive: { pointerEvents: 'none', zIndex: 0 },
  scene: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, opacity: 0.76, zIndex: 0 },
  fade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.transparent,
    borderBottomColor: 'rgba(255, 246, 229, 0.68)',
    borderBottomWidth: 220,
  },
});
