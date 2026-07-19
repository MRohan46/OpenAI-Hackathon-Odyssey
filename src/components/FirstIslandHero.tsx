import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ArrowRight, Compass, Play, Route, ShieldCheck } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotion } from '../hooks/useReducedMotion';
import { useApp } from '../state/AppProvider';
import { colors, fontFamilies, radii, spacing } from '../theme/tokens';
import { FirstIslandBackdrop } from '../world/FirstIslandBackdrop';
import { Button } from './Button';
import { Typography } from './Typography';

const skySerpent = require('../../assets/images/first-island/sky-serpent.png');
const tideGuardian = require('../../assets/images/first-island/tide-guardian.png');

export function FirstIslandHero() {
  const router = useRouter();
  const { enterPresentationMode } = useApp();
  const { width, height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const desktop = width >= 900;
  const compact = width < 360;
  const short = height < 760;
  const frameWidth = Math.max(0, Math.min(width, desktop ? 1440 : width) - (desktop ? 92 : 32));

  const brandIn = useSharedValue(reducedMotion ? 1 : 0);
  const copyIn = useSharedValue(reducedMotion ? 1 : 0);
  const companionsIn = useSharedValue(reducedMotion ? 1 : 0);
  const controlsIn = useSharedValue(reducedMotion ? 1 : 0);
  const float = useSharedValue(0);
  const tide = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      brandIn.value = 1;
      copyIn.value = 1;
      companionsIn.value = 1;
      controlsIn.value = 1;
      float.value = 0;
      tide.value = 0;
      return;
    }

    brandIn.value = withTiming(1, { duration: 620, easing: Easing.out(Easing.cubic) });
    copyIn.value = withDelay(110, withTiming(1, { duration: 840, easing: Easing.out(Easing.cubic) }));
    companionsIn.value = withDelay(280, withTiming(1, { duration: 920, easing: Easing.out(Easing.cubic) }));
    controlsIn.value = withDelay(520, withTiming(1, { duration: 760, easing: Easing.out(Easing.cubic) }));
    float.value = withDelay(
      1150,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      ),
    );
    tide.value = withDelay(
      650,
      withRepeat(withTiming(1, { duration: 9600, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
  }, [brandIn, companionsIn, controlsIn, copyIn, float, reducedMotion, tide]);

  const brandStyle = useAnimatedStyle(() => ({
    opacity: brandIn.value,
    transform: [{ translateY: interpolate(brandIn.value, [0, 1], [-18, 0]) }],
  }));

  const copyStyle = useAnimatedStyle(() => ({
    opacity: copyIn.value,
    transform: [
      { translateY: interpolate(copyIn.value, [0, 1], [34, 0]) },
      { scale: interpolate(copyIn.value, [0, 1], [0.96, 1]) },
    ],
  }));

  const leftCompanionStyle = useAnimatedStyle(() => ({
    opacity: companionsIn.value,
    transform: [
      { translateX: interpolate(companionsIn.value, [0, 1], [-64, 0]) },
      { translateY: interpolate(companionsIn.value, [0, 1], [30, 0]) + interpolate(float.value, [0, 1], [7, -10]) },
      { rotateZ: `${interpolate(float.value, [0, 1], [-8, -4.8])}deg` },
      { scale: interpolate(companionsIn.value, [0, 1], [0.78, 1]) },
    ],
  }));

  const rightCompanionStyle = useAnimatedStyle(() => ({
    opacity: companionsIn.value,
    transform: [
      { translateX: interpolate(companionsIn.value, [0, 1], [64, 0]) },
      { translateY: interpolate(companionsIn.value, [0, 1], [46, 0]) + interpolate(float.value, [0, 1], [-6, 9]) },
      { rotateZ: `${interpolate(float.value, [0, 1], [7, 3.8])}deg` },
      { scale: interpolate(companionsIn.value, [0, 1], [0.78, 1]) },
    ],
  }));

  const routeStyle = useAnimatedStyle(() => ({
    opacity: controlsIn.value,
    transform: [
      { translateY: interpolate(controlsIn.value, [0, 1], [30, 0]) },
      { scale: interpolate(tide.value, [0, 1], [0.99, 1.01]) },
    ],
  }));

  const actionsStyle = useAnimatedStyle(() => ({
    opacity: controlsIn.value,
    transform: [{ translateY: interpolate(controlsIn.value, [0, 1], [28, 0]) }],
  }));

  return (
    <View style={styles.root} testID="welcome-screen">
      <FirstIslandBackdrop />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            desktop && styles.scrollDesktop,
            short && styles.scrollShort,
            { minHeight: Math.max(height, 720), width: frameWidth },
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Animated.View style={[styles.topbar, desktop && styles.topbarDesktop, brandStyle]}>
            <View style={styles.brandLockup}>
              <View style={styles.brandMark}>
                <Compass size={20} strokeWidth={2.4} color={colors.ink} />
              </View>
              <View>
                <Typography variant="micro" color="rgba(255,255,255,0.68)" style={styles.tracking}>THE LIVING SHORE</Typography>
                <Typography variant="label" color={colors.white} style={styles.brandName}>ODYSSEY</Typography>
              </View>
            </View>
            <View style={styles.worldBadge}>
              <View style={styles.worldDot} />
              <Typography variant="micro" color={colors.white} style={styles.tracking}>
                {desktop ? 'WORLD 01 · FIRST ISLAND' : 'WORLD 01'}
              </Typography>
            </View>
          </Animated.View>

          <Animated.View style={[styles.copy, desktop && styles.copyDesktop, short && styles.copyShort, copyStyle]}>
            <View style={styles.eyebrowRow}>
              <View style={styles.eyebrowLine} />
              <Typography variant="micro" color="#E9FFF9" style={styles.tracking}>FIRST ISLAND · ONE CLEAR ROUTE.</Typography>
              <View style={styles.eyebrowLine} />
            </View>
            <Typography variant="hero" color={colors.white} style={[styles.title, compact && styles.titleCompact, desktop && styles.titleDesktop]}>
              Turn one goal into a world worth crossing.
            </Typography>
            <Typography variant="body" color="rgba(255,255,255,0.84)" style={[styles.lede, compact && styles.ledeCompact, desktop && styles.ledeDesktop]}>
              Ten levels. Three mini-bosses. One final victory. You choose the destination; Odyssey keeps the next quest impossible to miss.
            </Typography>
          </Animated.View>

          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[styles.companionStage, desktop && styles.companionStageDesktop, short && styles.companionStageShort]}
          >
            <Animated.View style={[styles.leftCompanion, desktop && styles.leftCompanionDesktop, leftCompanionStyle]}>
              <View style={styles.companionHalo} />
              <Image
                accessible={false}
                alt=""
                accessibilityLabel=""
                source={skySerpent}
                contentFit="contain"
                cachePolicy="memory-disk"
                priority="high"
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
            <Animated.View style={[styles.rightCompanion, desktop && styles.rightCompanionDesktop, rightCompanionStyle]}>
              <View style={[styles.companionHalo, styles.companionHaloWarm]} />
              <Image
                accessible={false}
                alt=""
                accessibilityLabel=""
                source={tideGuardian}
                contentFit="contain"
                cachePolicy="memory-disk"
                priority="high"
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>

          <View style={[styles.controls, desktop && styles.controlsDesktop, short && styles.controlsShort]}>
            <Animated.View
              style={[
                styles.routeCard,
                desktop && styles.routeCardDesktop,
                { width: desktop ? 602 : Math.max(0, frameWidth - 24) },
                routeStyle,
              ]}
            >
              <View style={styles.routeHeader}>
                <View style={styles.routeIcon}>
                  <Route size={18} strokeWidth={2.3} color={colors.ink} />
                </View>
                <View style={styles.routeCopy}>
                  <Typography variant="micro" color={colors.waterDeep} style={styles.tracking}>YOUR ROUTE · ALWAYS EDITABLE</Typography>
                  <Typography variant="label">You approve every level before the journey begins.</Typography>
                </View>
                <ShieldCheck size={21} strokeWidth={2.2} color={colors.waterDeep} />
              </View>
              <View style={styles.stageRow}>
                {[
                  ['01', 'Choose'],
                  ['02', 'Chart'],
                  ['03', 'Conquer'],
                ].map(([number, label], index) => (
                  <React.Fragment key={number}>
                    <View style={styles.stage}>
                      <Typography variant="micro" color={colors.coralText}>{number}</Typography>
                      <Typography variant="micro" color={colors.ink} style={styles.stageLabel}>{label}</Typography>
                    </View>
                    {index < 2 ? <View style={styles.stageConnector} /> : null}
                  </React.Fragment>
                ))}
              </View>
            </Animated.View>

            <Animated.View style={[styles.actions, desktop && styles.actionsDesktop, actionsStyle]}>
              <View style={[styles.primaryAction, desktop && styles.actionDesktop]}>
                <Button
                  label="Choose your first goal"
                  icon={ArrowRight}
                  onPress={() => router.push('/sign-up')}
                  accessibilityHint="Opens account creation and goal setup"
                />
              </View>
              <View style={[styles.secondaryAction, desktop && styles.actionDesktop]}>
                <Button
                  label="Enter your journey"
                  variant="secondary"
                  onPress={() => router.push('/sign-in')}
                  accessibilityHint="Opens sign in"
                />
              </View>
              <Button
                label="Explore the living world"
                icon={Play}
                variant="ghost"
                compact
                onPress={() => {
                  enterPresentationMode();
                  setTimeout(() => router.replace('/(tabs)/today'), 0);
                }}
                accessibilityHint="Opens the interactive Odyssey demo"
              />
            </Animated.View>
          </View>

          <Animated.View style={[styles.scrollCue, brandStyle]}>
            <View style={styles.scrollLine} />
            <Typography variant="micro" color="rgba(255,255,255,0.64)" style={styles.tracking}>THE HORIZON MOVES WHEN YOU DO</Typography>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 720, overflow: 'hidden', backgroundColor: '#0D6E91' },
  safe: { flex: 1, zIndex: 5 },
  scroll: {
    alignSelf: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  scrollDesktop: { maxWidth: 1348, paddingTop: spacing.md },
  scrollShort: { paddingTop: 4, paddingBottom: spacing.sm },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 },
  topbarDesktop: { paddingHorizontal: spacing.md },
  brandLockup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
  },
  brandName: { letterSpacing: 2.2, lineHeight: 16 },
  tracking: { letterSpacing: 1.35, fontFamily: fontFamilies.bodyBold },
  worldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(4, 35, 65, 0.52)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  worldDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.sun },
  copy: { width: '100%', alignItems: 'center', zIndex: 7, marginTop: 42, paddingHorizontal: 2 },
  copyDesktop: { marginTop: 58, maxWidth: 830, alignSelf: 'center' },
  copyShort: { marginTop: 26 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  eyebrowLine: { width: 32, height: 1, backgroundColor: 'rgba(233,255,249,0.54)' },
  title: {
    width: '100%',
    maxWidth: 620,
    flexShrink: 1,
    textAlign: 'center',
    fontSize: 47,
    lineHeight: 47,
    letterSpacing: -2.65,
  },
  titleDesktop: { maxWidth: 820, fontSize: 78, lineHeight: 75, letterSpacing: -4.4 },
  titleCompact: { fontSize: 40, lineHeight: 40, letterSpacing: -2.2 },
  lede: {
    width: '100%',
    maxWidth: 350,
    flexShrink: 1,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 23,
  },
  ledeDesktop: { maxWidth: 620, fontSize: 17, lineHeight: 26 },
  ledeCompact: { fontSize: 14, lineHeight: 20 },
  companionStage: { position: 'absolute', left: 0, right: 0, top: 290, height: 244, zIndex: 6, pointerEvents: 'none' },
  companionStageDesktop: { top: 155, height: 500 },
  companionStageShort: { top: 235, transform: [{ scale: 0.78 }] },
  leftCompanion: { position: 'absolute', left: -32, top: 40, width: 188, height: 204 },
  leftCompanionDesktop: { left: 6, top: 66, width: 360, height: 390 },
  rightCompanion: { position: 'absolute', right: -10, top: 63, width: 176, height: 176 },
  rightCompanionDesktop: { right: 18, top: 92, width: 350, height: 350 },
  companionHalo: {
    position: 'absolute',
    left: '9%',
    right: '9%',
    top: '12%',
    bottom: '7%',
    borderRadius: 999,
    backgroundColor: 'rgba(182, 248, 255, 0.17)',
    borderWidth: 1,
    borderColor: 'rgba(225, 254, 255, 0.28)',
  },
  companionHaloWarm: { backgroundColor: 'rgba(255, 235, 174, 0.14)' },
  controls: { width: '100%', maxWidth: '100%', marginTop: 210, zIndex: 9, gap: 9, alignItems: 'center' },
  controlsDesktop: { marginTop: 308, maxWidth: 820, width: '100%', alignSelf: 'center' },
  controlsShort: { marginTop: 56 },
  routeCard: {
    maxWidth: 520,
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: 24,
    backgroundColor: 'rgba(250, 255, 255, 0.86)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    boxShadow: '0 18px 38px rgba(6, 42, 90, 0.18)',
  },
  routeCardDesktop: { maxWidth: 650, paddingHorizontal: spacing.lg },
  routeHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 199, 44, 0.76)',
  },
  routeCopy: { flex: 1, gap: 1 },
  stageRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  stage: { alignItems: 'center', gap: 1 },
  stageLabel: { fontFamily: fontFamilies.bodyBold, letterSpacing: 0.7 },
  stageConnector: { flex: 1, height: 1, marginHorizontal: 8, backgroundColor: 'rgba(6,42,90,0.18)' },
  actions: { width: '100%', maxWidth: 520, gap: 8 },
  actionsDesktop: { maxWidth: 650, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' },
  primaryAction: { width: '100%' },
  secondaryAction: { width: '100%' },
  actionDesktop: { width: 240 },
  scrollCue: { alignItems: 'center', gap: 7, marginTop: 'auto', paddingTop: spacing.md },
  scrollLine: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.45)' },
});
