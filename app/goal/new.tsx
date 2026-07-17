import { useRouter } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '../../src/components/Button';
import { Chip } from '../../src/components/Chip';
import { ChoiceGroup } from '../../src/components/ChoiceGroup';
import { Field } from '../../src/components/Field';
import { LivingScreen } from '../../src/components/LivingScreen';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Surface } from '../../src/components/Surface';
import { Typography } from '../../src/components/Typography';
import type { Intensity } from '../../src/types/domain';
import { colors, spacing } from '../../src/theme/tokens';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function NewGoalScreen() {
  const router = useRouter();
  const [goalTitle, setGoalTitle] = useState('Prepare confidently for my mathematics examination');
  const [deadline, setDeadline] = useState('2026-09-25');
  const [startingPoint, setStartingPoint] = useState('I know the foundations but need reliable timed practice.');
  const [availableDays, setAvailableDays] = useState(['Mon', 'Wed', 'Fri', 'Sat']);
  const [minutes, setMinutes] = useState('45');
  const [intensity, setIntensity] = useState<Intensity>('normal');
  const [constraints, setConstraints] = useState('Keep Sunday free and make the final three weeks exam-focused.');
  const [error, setError] = useState<string | null>(null);

  const continueToGeneration = () => {
    if (goalTitle.trim().length < 6 || !deadline || availableDays.length === 0 || Number(minutes) < 10) {
      setError('Add a clear destination, deadline, available day, and at least 10 minutes per session.');
      return;
    }
    setError(null);
    router.push({
      pathname: '/roadmap/generating',
      params: {
        goalTitle,
        deadline,
        startingPoint,
        availableDays: availableDays.join(','),
        minutesPerDay: minutes,
        preferredIntensity: intensity,
        constraints,
      },
    });
  };

  return (
    <LivingScreen dim={0.24}>
      <ScreenHeader back title="Choose the destination" eyebrow="New Odyssey" />
      <Typography variant="body" color={colors.inkSecondary}>Give the route enough truth to fit your life. Nothing becomes active until you review it.</Typography>
      <Surface padding="large" style={styles.form}>
        <Field label="What does victory look like?" value={goalTitle} onChangeText={setGoalTitle} multiline help="Describe the result, not just the activity." />
        <Field label="Target date" value={deadline} onChangeText={setDeadline} placeholder="YYYY-MM-DD" />
        <Field label="Where are you starting?" value={startingPoint} onChangeText={setStartingPoint} multiline />
        <View style={styles.group}>
          <Typography variant="label">Days available</Typography>
          <View style={styles.chips}>{days.map((day) => <Chip key={day} label={day} selected={availableDays.includes(day)} tone="water" onPress={() => setAvailableDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day])} />)}</View>
        </View>
        <Field label="Minutes per available day" value={minutes} onChangeText={setMinutes} keyboardType="number-pad" />
        <ChoiceGroup label="Preferred effort" value={intensity} options={['light', 'normal', 'intense'] as const} onChange={setIntensity} />
        <Field label="Real-life constraints" value={constraints} onChangeText={setConstraints} multiline help="Examples: recovery days, equipment, travel, privacy, or fixed commitments." />
        {error ? <Typography variant="micro" color={colors.coralText}>{error}</Typography> : null}
        <Button label="Chart my proposed route" icon={Sparkles} onPress={continueToGeneration} />
      </Surface>
    </LivingScreen>
  );
}

const styles = StyleSheet.create({ form: { gap: spacing.lg }, group: { gap: spacing.xs }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs } });
