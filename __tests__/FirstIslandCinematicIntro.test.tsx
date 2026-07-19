import { act, render } from '@testing-library/react-native';
import { useAudioPlayer } from 'expo-audio';
import React from 'react';

import { FirstIslandCinematicIntro } from '../src/components/FirstIslandCinematicIntro';

let mockReducedMotion = false;

jest.mock('../src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => mockReducedMotion,
}));

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
      linear: (value: number) => value,
    },
    interpolate: (_value: number, _input: number[], output: number[]) => output[output.length - 1],
    useAnimatedStyle: (factory: () => object) => factory(),
    useSharedValue: (value: number) => ({ value }),
    withTiming: (value: unknown) => value,
  };
});

describe('FirstIslandCinematicIntro thunder sound', () => {
  const player = {
    loop: true,
    volume: 1,
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    jest.useFakeTimers();
    mockReducedMotion = false;
    player.loop = true;
    player.volume = 1;
    player.play.mockClear();
    player.pause.mockClear();
    player.seekTo.mockClear();
    jest.mocked(useAudioPlayer).mockClear();
    jest
      .mocked(useAudioPlayer)
      .mockReturnValue(player as unknown as ReturnType<typeof useAudioPlayer>);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('plays once at the first lightning impact and stops on cleanup', async () => {
    const view = await render(<FirstIslandCinematicIntro />);

    expect(useAudioPlayer).toHaveBeenCalledWith(expect.anything(), {
      downloadFirst: true,
      updateInterval: 1000,
    });
    await act(async () => jest.advanceTimersByTime(2389));
    expect(player.play).not.toHaveBeenCalled();

    await act(async () => jest.advanceTimersByTime(1));
    expect(player.play).toHaveBeenCalledTimes(1);

    await act(async () => view.unmount());
    expect(player.pause).toHaveBeenCalledTimes(1);
  });

  it('does not play when reduced motion skips the cinematic', async () => {
    mockReducedMotion = true;
    const view = await render(<FirstIslandCinematicIntro />);

    await act(async () => jest.advanceTimersByTime(6000));

    expect(player.play).not.toHaveBeenCalled();
    expect(player.pause).toHaveBeenCalledTimes(1);
    await act(async () => view.unmount());
  });
});
