import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Camera, Check, Image as ImageIcon, LockKeyhole } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '../../src/components/Button';
import { LivingScreen } from '../../src/components/LivingScreen';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Surface } from '../../src/components/Surface';
import { Typography } from '../../src/components/Typography';
import { useApp } from '../../src/state/AppProvider';
import { colors, radii, spacing } from '../../src/theme/tokens';

export default function ProofCaptureScreen() {
  const router = useRouter();
  const { activeProofUri, setActiveProofUri } = useApp();
  const [preview, setPreview] = useState<string | null>(activeProofUri);
  const [error, setError] = useState<string | null>(null);

  const choose = async (camera: boolean) => {
    setError(null);
    const permission = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return setError(`Odyssey needs ${camera ? 'camera' : 'photo library'} permission only when you choose to add proof.`);
    const result = camera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [4, 3] })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [4, 3] });
    if (!result.canceled) setPreview(result.assets[0].uri);
  };
  const useProof = () => { setActiveProofUri(preview); router.back(); };

  return (
    <LivingScreen dim={0.28}>
      <ScreenHeader back title="Private proof" eyebrow="Your evidence" />
      <Surface padding="large" style={styles.trust}>
        <LockKeyhole size={23} color={colors.waterDeep} />
        <View style={styles.copy}><Typography variant="label">Private by design</Typography><Typography variant="body" color={colors.inkSecondary}>This local preview is not a public post and is never treated as automatic machine-verifiable truth.</Typography></View>
      </Surface>
      <View style={styles.preview}>
        {preview ? <Image source={{ uri: preview }} contentFit="cover" style={StyleSheet.absoluteFill} /> : <View style={styles.placeholder}><ImageIcon size={38} color={colors.waterDeep} /><Typography variant="heading">No proof selected</Typography><Typography variant="body" color={colors.inkSecondary} style={styles.center}>Choose a new photo or one already on this device.</Typography></View>}
      </View>
      <View style={styles.actions}>
        <Button label="Take photo" icon={Camera} variant="secondary" onPress={() => choose(true)} />
        <Button label="Choose from library" icon={ImageIcon} variant="secondary" onPress={() => choose(false)} />
      </View>
      {error ? <Typography variant="micro" color={colors.coralText}>{error}</Typography> : null}
      <Button label="Use this proof" icon={Check} disabled={!preview} onPress={useProof} />
    </LivingScreen>
  );
}
const styles = StyleSheet.create({
  trust: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }, copy: { flex: 1, gap: 3 },
  preview: { aspectRatio: 4 / 3, borderRadius: radii.lg, overflow: 'hidden', backgroundColor: colors.mistStrong, borderWidth: 1, borderColor: colors.line },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl }, center: { textAlign: 'center' }, actions: { gap: spacing.sm },
});
