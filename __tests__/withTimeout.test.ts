import { RequestTimeoutError, withTimeout } from '../src/api/withTimeout';

describe('withTimeout', () => {
  it('returns a prompt result before its deadline', async () => {
    await expect(withTimeout(Promise.resolve('route ready'), 100, 'timed out')).resolves.toBe('route ready');
  });

  it('provides a terminal, actionable failure for a stalled request', async () => {
    await expect(withTimeout(new Promise<never>(() => undefined), 1, 'The roadmap service did not respond.')).rejects.toEqual(
      expect.objectContaining<RequestTimeoutError>({ name: 'RequestTimeoutError', message: 'The roadmap service did not respond.' }),
    );
  });
});
