import { Platform } from 'react-native';

export const colors = {
  sky: '#DFF5FF',
  skyStrong: '#AEE7F7',
  water: '#18B8C8',
  waterDeep: '#08786F',
  sand: '#FFF6E5',
  sandStrong: '#E7D7B9',
  ink: '#062A5A',
  inkSecondary: '#52657A',
  sun: '#FFC72C',
  coral: '#FF715B',
  coralText: '#B33A2E',
  success: '#08786F',
  white: '#FFFFFF',
  mist: 'rgba(255, 255, 255, 0.88)',
  mistStrong: 'rgba(255, 255, 255, 0.96)',
  line: 'rgba(6, 42, 90, 0.14)',
  overlay: 'rgba(6, 42, 90, 0.42)',
  transparent: 'transparent',
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  hero: 64,
} as const;

export const radii = {
  sm: 12,
  md: 18,
  lg: 26,
  pill: 999,
} as const;

export const fontFamilies = {
  display: 'BricolageGrotesque_700Bold',
  displayMedium: 'BricolageGrotesque_600SemiBold',
  body: 'Manrope_400Regular',
  bodyMedium: 'Manrope_500Medium',
  bodySemiBold: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',
} as const;

export const typeScale = {
  hero: 52,
  display: 38,
  title: 30,
  heading: 23,
  body: 16,
  label: 14,
  micro: 12,
} as const;

export const shadows = Platform.select({
  ios: {
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
  },
  android: { elevation: 5 },
  default: {
    boxShadow: '0 12px 28px rgba(6, 42, 90, 0.12)',
  },
});

export const layout = {
  referenceWidth: 390,
  referenceHeight: 844,
  contentMax: 620,
  touchTarget: 48,
} as const;

export type ColorName = keyof typeof colors;
