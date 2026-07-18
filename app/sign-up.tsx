import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { ArrowRight, Globe2 } from 'lucide-react-native';
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

const schema = z.object({
  name: z.string().min(2, 'Tell us what to call you.'),
  email: z.email('Enter a valid email.'),
  password: z.string().min(8, 'Use at least 8 characters.'),
});
type FormValues = z.infer<typeof schema>;

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, signInWithGoogle } = useApp();
  const [apiError, setApiError] = useState<string | null>(null);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: 'Maya', email: 'maya@example.com', password: 'odyssey!' },
  });
  const submit = handleSubmit(async (values) => {
    setApiError(null);
    setConfirmationMessage(null);
    const result = await signUp(values.name, values.email, values.password);
    if (result.error) setApiError(result.error);
    else if (result.confirmationRequired) setConfirmationMessage('Check your email to confirm your account, then return to Odyssey to sign in.');
    else router.replace('/goal/new');
  });
  const continueWithGoogle = async () => {
    setApiError(null);
    setConfirmationMessage(null);
    setGoogleLoading(true);
    const error = await signInWithGoogle();
    setGoogleLoading(false);
    if (error) setApiError(error);
    else router.replace('/goal/new');
  };
  return (
    <LivingScreen dim={0.28}>
      <ScreenHeader back eyebrow="New journey" />
      <View style={styles.hero}>
        <Typography variant="display">Name your first horizon.</Typography>
        <Typography variant="body" color={colors.inkSecondary}>The account opens the door. You still decide the destination.</Typography>
      </View>
      <Surface padding="large" style={styles.form}>
        <Controller control={control} name="name" render={({ field: { onChange, value } }) => <Field label="Name" value={value} onChangeText={onChange} error={errors.name?.message} />} />
        <Controller control={control} name="email" render={({ field: { onChange, value } }) => <Field label="Email" value={value} onChangeText={onChange} autoCapitalize="none" keyboardType="email-address" error={errors.email?.message} />} />
        <Controller control={control} name="password" render={({ field: { onChange, value } }) => <Field label="Password" value={value} onChangeText={onChange} secureTextEntry error={errors.password?.message} />} />
        {apiError ? <Typography variant="micro" color={colors.coralText}>{apiError}</Typography> : null}
        {confirmationMessage ? <Typography variant="micro" color={colors.success}>{confirmationMessage}</Typography> : null}
        <Button label="Choose my destination" icon={ArrowRight} onPress={submit} loading={isSubmitting} />
        <Button label="Continue with Google" icon={Globe2} variant="secondary" onPress={continueWithGoogle} loading={googleLoading} disabled={isSubmitting} />
        <Button label="I already have an account" variant="ghost" onPress={() => router.replace('/sign-in')} />
      </Surface>
    </LivingScreen>
  );
}

const styles = StyleSheet.create({ hero: { gap: spacing.xs, marginTop: spacing.xl }, form: { gap: spacing.md } });
