import React from 'react';
import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';

import { colors, fontFamilies, radii, spacing } from '../theme/tokens';
import { Typography } from './Typography';

interface FieldProps extends TextInputProps {
  label: string;
  error?: string;
  help?: string;
}

export function Field({ label, error, help, style, multiline, ...props }: FieldProps) {
  return (
    <View style={styles.wrap}>
      <Typography variant="label">{label}</Typography>
      <TextInput
        {...props}
        accessibilityLabel={label}
        multiline={multiline}
        placeholderTextColor={colors.inkSecondary}
        style={[styles.input, multiline && styles.multiline, error && styles.errorInput, style]}
      />
      {error ? (
        <Typography variant="micro" color={colors.coralText}>
          {error}
        </Typography>
      ) : help ? (
        <Typography variant="micro" color={colors.inkSecondary}>
          {help}
        </Typography>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  input: {
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.mistStrong,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.ink,
    fontFamily: fontFamilies.body,
    fontSize: 16,
  },
  multiline: { minHeight: 104, textAlignVertical: 'top' },
  errorInput: { borderColor: colors.coral },
});
