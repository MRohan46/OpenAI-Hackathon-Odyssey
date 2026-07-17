import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';

import { colors, fontFamilies, typeScale } from '../theme/tokens';

export type TextVariant = 'hero' | 'display' | 'title' | 'heading' | 'body' | 'label' | 'micro';

const variantStyles: Record<TextVariant, TextStyle> = {
  hero: { fontFamily: fontFamilies.display, fontSize: typeScale.hero, lineHeight: 54, letterSpacing: -2.4 },
  display: { fontFamily: fontFamilies.display, fontSize: typeScale.display, lineHeight: 41, letterSpacing: -1.6 },
  title: { fontFamily: fontFamilies.display, fontSize: typeScale.title, lineHeight: 34, letterSpacing: -1 },
  heading: { fontFamily: fontFamilies.displayMedium, fontSize: typeScale.heading, lineHeight: 28, letterSpacing: -0.45 },
  body: { fontFamily: fontFamilies.body, fontSize: typeScale.body, lineHeight: 24 },
  label: { fontFamily: fontFamilies.bodySemiBold, fontSize: typeScale.label, lineHeight: 20 },
  micro: { fontFamily: fontFamilies.bodySemiBold, fontSize: typeScale.micro, lineHeight: 16, letterSpacing: 0.2 },
};

interface TypographyProps extends TextProps {
  variant?: TextVariant;
  color?: string;
}

export function Typography({ variant = 'body', color = colors.ink, style, ...props }: TypographyProps) {
  return <Text {...props} style={[variantStyles[variant], { color }, style]} />;
}
