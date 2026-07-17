import { render } from '@testing-library/react-native';
import React from 'react';

import { ProgressBar } from '../src/components/ProgressBar';

describe('ProgressBar', () => {
  it('exposes bounded progress semantics to assistive technology', async () => {
    const view = await render(<ProgressBar value={140} accessibilityLabel="Boss health" />);
    const progressbar = view.getByRole('progressbar', { name: 'Boss health' });
    expect(progressbar.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 100 });
  });
});
