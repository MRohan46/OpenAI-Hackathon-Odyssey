import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { LogIn } from 'lucide-react-native';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { Button } from '../src/components/Button';
import { Field } from '../src/components/Field';
import { LivingScreen } from '../src/components/LivingScreen';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { Surface } from '../src/components/Surface';
import { Typography } from '../src/components/Typography';
import { useApp } from '../src/state/AppProvider';
import { colors, spacing } from '../src/theme/tokens';

const schema = z.object({ email: z.email('Enter a valid email.'), password: z.string().min(6, 'Use at least 6 characters.') });
type FormValues = z.infer<typeof schema>;

export default function SignInScreen() {
  const router = useRouter();
  const { signIn } = useApp();
  const [apiError, setApiError] = useState<string | null>(null);
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: 'maya@example.com', password: 'odyssey' },
  });

  const submit = handleSubmit(async (values) => {
    setApiError(null);
    const error = await signIn(values.email, values.password);
    if (error) setApiError(error);
    else router.replace('/(tabs)/today');
  });

  return (
    <LivingScreen dim={0.28}>
      <ScreenHeader back eyebrow="Welcome back" />
      <View style={styles.hero}>
        <Typography variant="display">Return to your path.</Typography>
        <Typography variant="body" color={colors.inkSecondary}>Your next clear step is waiting.</Typography>
      </View>
      <Surface padding="large" style={styles.form}>
        <Controller control={control} name="email" render={({ field: { onChange, value } }) => (
          <Field label="Email" value={value} onChangeText={onChange} autoCapitalize="none" keyboardType="email-address" error={errors.email?.message} />
        )} />
        <Controller control={control} name="password" render={({ field: { onChange, value } }) => (
          <Field label="Password" value={value} onChangeText={onChange} secureTextEntry error={errors.password?.message} />
        )} />
        {apiError ? <Typography variant="micro" color={colors.coralText}>{apiError}</Typography> : null}
        <Button label="Enter Odyssey" icon={LogIn} onPress={submit} loading={isSubmitting} />
        <Button label="Create a new account" variant="ghost" onPress={() => router.replace('/sign-up')} />
      </Surface>
    </LivingScreen>
  );
}

const styles = StyleSheet.create({ hero: { gap: spacing.xs, marginTop: spacing.xl }, form: { gap: spacing.md } });
