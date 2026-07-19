import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import WelcomeScreen from '../app/welcome';
import { AppProvider, useApp } from '../src/state/AppProvider';

const mockPush = jest.fn();
const mockReplace = jest.fn();

function PresentationModeProbe() {
  const { presentationMode } = useApp();
  return <Text testID="presentation-mode">{presentationMode ? 'presentation' : 'authenticated-only'}</Text>;
}

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

jest.mock(
  '@react-native-async-storage/async-storage',
  () => jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('lucide-react-native', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  const Icon = (props: object) => ReactModule.createElement(View, props);
  return {
    ArrowRight: Icon,
    Compass: Icon,
    Play: Icon,
    Route: Icon,
    ShieldCheck: Icon,
  };
});

jest.mock('../src/world/FirstIslandBackdrop', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return { FirstIslandBackdrop: () => ReactModule.createElement(View, { testID: 'first-island-backdrop' }) };
});

jest.mock('../src/components/FirstIslandCinematicIntro', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return { FirstIslandCinematicIntro: () => ReactModule.createElement(View, { testID: 'first-island-cinematic-intro' }) };
});

jest.mock('expo-image', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return { Image: (props: object) => ReactModule.createElement(View, props) };
});

jest.mock('react-native-reanimated', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    __esModule: true,
    default: { View },
    Easing: {
      cubic: (value: number) => value,
      inOut: (value: unknown) => value,
      out: (value: unknown) => value,
      sin: (value: number) => value,
    },
    interpolate: (_value: number, _input: number[], output: number[]) => output[output.length - 1],
    useAnimatedStyle: (factory: () => object) => factory(),
    useSharedValue: (value: number) => ({ value }),
    withDelay: (_delay: number, value: unknown) => value,
    withRepeat: (value: unknown) => value,
    withSequence: (...values: unknown[]) => values[values.length - 1],
    withTiming: (value: unknown) => value,
  };
});

describe('First Island welcome hero', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  it('presents the progression and keeps user approval explicit', async () => {
    const view = await render(
      <AppProvider>
        <WelcomeScreen />
      </AppProvider>,
    );

    expect(view.getByTestId('first-island-backdrop')).toBeTruthy();
    expect(view.getByTestId('first-island-cinematic-intro')).toBeTruthy();
    expect(view.getByText(/WORLD 01/)).toBeTruthy();
    expect(view.getByText('Turn one goal into a world worth crossing.')).toBeTruthy();
    expect(view.getByText('YOUR ROUTE · ALWAYS EDITABLE')).toBeTruthy();
    expect(view.getByText('You approve every level before the journey begins.')).toBeTruthy();
    expect(view.getByText('01')).toBeTruthy();
    expect(view.getByText('02')).toBeTruthy();
    expect(view.getByText('03')).toBeTruthy();
  });

  it('preserves sign-up, sign-in, and demo navigation', async () => {
    const view = await render(
      <AppProvider>
        <WelcomeScreen />
        <PresentationModeProbe />
      </AppProvider>,
    );

    fireEvent.press(view.getByRole('button', { name: 'Choose your first goal' }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/sign-up'));

    fireEvent.press(view.getByRole('button', { name: 'Enter your journey' }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/sign-in'));

    await act(async () => {
      fireEvent.press(view.getByRole('button', { name: 'Explore the living world' }));
    });
    await waitFor(() => expect(view.getByTestId('presentation-mode').props.children).toBe('presentation'));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(tabs)/today'));
  });
});
