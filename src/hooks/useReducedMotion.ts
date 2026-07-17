import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

import { useApp } from '../state/AppProvider';

export function useReducedMotion() {
  const { preferences } = useApp();
  const [systemReduced, setSystemReduced] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setSystemReduced).catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setSystemReduced);
    return () => subscription.remove();
  }, []);

  if (preferences.reducedMotionOverride === 'on') return true;
  if (preferences.reducedMotionOverride === 'off') return false;
  return systemReduced;
}
