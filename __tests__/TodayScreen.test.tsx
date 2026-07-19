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
  return {
    AlertTriangle: Icon,
    Bell: Icon,
    Check: Icon,
    ChevronDown: Icon,
    ChevronUp: Icon,
    Clock3: Icon,
    Flame: Icon,
    LoaderCircle: Icon,
    Plus: Icon,
    Route: Icon,
    X: Icon,
  };
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
    expect(view.getByText('Endurance Tide')).toBeTruthy();
    expect(view.getByText('34% health')).toBeTruthy();
    expect(view.getByText('Calculus Focus Session')).toBeTruthy();
    expect(view.getByText('Scheduled · 7:00 PM–8:15 PM')).toBeTruthy();
    expect(view.getByText('45 min · High · Intense')).toBeTruthy();
    expect(view.getByText('90 XP · 12 rubies · 7 damage')).toBeTruthy();
    expect(view.getByText('Completed · 6:52 AM')).toBeTruthy();
    expect(view.getByText('Upcoming · 8:30 PM–9:30 PM')).toBeTruthy();
    expect(view.getByText('Overdue · 5:30 PM')).toBeTruthy();
    expect(view.getByText('Every quest is on one living road')).toBeTruthy();
    expect(view.getByTestId('infinite-quest-road', { includeHiddenElements: true })).toBeTruthy();
    expect(view.getByTestId('road-triptych-1', { includeHiddenElements: true })).toBeTruthy();
    expect(view.getByTestId('quest-route-line', { includeHiddenElements: true })).toBeTruthy();
    expect(view.getByTestId('flame-dragon-decoration', { includeHiddenElements: true })).toBeTruthy();
    expect(view.getByTestId('guide-dragon-decoration', { includeHiddenElements: true })).toBeTruthy();
    expect(view.getByTestId('roadmap-card-quest-formulas')).toBeTruthy();
    expect(view.getByTestId('roadmap-card-quest-calculus')).toBeTruthy();
    expect(view.getByTestId('roadmap-card-quest-timed')).toBeTruthy();
    expect(view.getByTestId('roadmap-card-quest-mobility')).toBeTruthy();
    expect(view.getByRole('progressbar', { name: 'Roadmap level 7 of 10' })).toBeTruthy();
    expect(view.getByRole('progressbar', { name: 'Endurance Tide health' })).toBeTruthy();
  });

  it('keeps the primary action, every quest, and the navigator interactive', async () => {
    const view = await render(
      <AppProvider>
        <TodayScreen />
      </AppProvider>,
    );

    fireEvent.press(view.getByRole('button', { name: 'Begin quest' }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/quest/quest-mobility/complete'));

    fireEvent.press(view.getByTestId('quest-navigator-trigger'));
    await waitFor(() => expect(view.getByTestId('quest-navigator-dropdown')).toBeTruthy());
    fireEvent.press(view.getByRole('button', { name: /Jump to Evening mobility/ }));
    await waitFor(() => expect(view.queryByTestId('quest-navigator-dropdown')).toBeNull());

    fireEvent.press(view.getByTestId('roadmap-card-button-quest-mobility'));
    expect(mockPush).toHaveBeenCalledWith('/quest/quest-mobility');
  });
});
