import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import TodayScreen from '../app/(tabs)/today';
import { AppProvider } from '../src/state/AppProvider';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock(
  '@react-native-async-storage/async-storage',
  () => jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('lucide-react-native', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  const Icon = (props: object) => ReactModule.createElement(View, props);
  return { Bell: Icon, Check: Icon, Flame: Icon, Plus: Icon };
});

jest.mock('react-native-reanimated', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    __esModule: true,
    default: { View },
    Easing: { inOut: (value: unknown) => value, sin: (value: number) => value },
    interpolate: (_value: number, _input: number[], output: number[]) => output[0],
    useAnimatedStyle: (factory: () => object) => factory(),
    useSharedValue: (value: number) => ({ value }),
    withRepeat: (value: unknown) => value,
    withTiming: (value: unknown) => value,
  };
});

describe('Tide Observatory Today screen', () => {
  beforeEach(() => mockPush.mockClear());

  it('keeps Today progress semantics native and data-driven', async () => {
    const view = await render(
      <AppProvider>
        <TodayScreen />
      </AppProvider>,
    );

    expect(view.getByText('One clear step')).toBeTruthy();
    expect(view.getByText('Study Boss')).toBeTruthy();
    expect(view.getByText('62% health')).toBeTruthy();
    expect(view.getByText('Calculus Focus Session')).toBeTruthy();
    expect(view.getByText('7:00 PM · 45 min')).toBeTruthy();
    expect(view.getByText('Completed · 6:52 AM')).toBeTruthy();
    expect(view.getByText('Upcoming · 8:30 PM')).toBeTruthy();
    expect(view.getByRole('progressbar', { name: 'Roadmap level 4 of 10' })).toBeTruthy();
    expect(view.getByRole('progressbar', { name: 'Study Boss health' })).toBeTruthy();
  });

  it('keeps the primary and overflow quest paths interactive', async () => {
    const view = await render(
      <AppProvider>
        <TodayScreen />
      </AppProvider>,
    );

    fireEvent.press(view.getByRole('button', { name: 'Begin quest' }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/quest/quest-calculus/complete'));

    fireEvent.press(view.getByTestId('overflow-quest-pill'));
    expect(mockPush).toHaveBeenCalledWith('/quest/quest-mobility');
  });
});
