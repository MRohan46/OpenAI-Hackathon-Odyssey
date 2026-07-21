import handler from '../api/v1/roadmaps/generate';

function responseRecorder() {
  const result: { status: number; headers: Record<string, string>; body?: unknown; ended: boolean } = {
    status: 200,
    headers: {},
    ended: false,
  };
  return {
    result,
    response: {
      status(code: number) { result.status = code; return this; },
      setHeader(name: string, value: string) { result.headers[name] = value; },
      json(body: unknown) { result.body = body; },
      end() { result.ended = true; },
    },
  };
}

const validInput = {
  goalTitle: 'Prepare for a mathematics examination',
  deadline: '2026-09-25',
  startingPoint: 'I know the foundations.',
  availableDays: ['Mon', 'Wed', 'Fri'],
  minutesPerDay: 45,
  preferredIntensity: 'normal',
  constraints: 'Keep Sunday free.',
};

describe('roadmap Vercel API', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test';
    process.env.GROQ_API_KEY = 'gsk_test_secret';
    process.env.GROQ_MODEL = 'test-model';
    process.env.ALLOWED_ORIGINS = 'https://odyssey.example';
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('rejects requests without a bearer token and never returns secrets', async () => {
    const { result, response } = responseRecorder();
    await handler({ method: 'POST', headers: {}, body: validInput }, response);

    expect(result.status).toBe(401);
    expect(JSON.stringify(result.body)).not.toContain('gsk_test_secret');
    expect(result.headers['Cache-Control']).toBe('no-store');
  });

  it('rejects a disallowed browser origin', async () => {
    const { result, response } = responseRecorder();
    await handler({ method: 'OPTIONS', headers: { origin: 'https://attacker.example' } }, response);

    expect(result.status).toBe(403);
    expect(result.headers['Access-Control-Allow-Origin']).toBeUndefined();
  });

  it('validates input after verifying the Supabase user', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'user-1' }) }) as typeof fetch;
    const { result, response } = responseRecorder();
    await handler({ method: 'POST', headers: { authorization: 'Bearer valid-user-token' }, body: { ...validInput, minutesPerDay: 0 } }, response);

    expect(result.status).toBe(422);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('returns a normalized ten-level proposal from Groq', async () => {
    const levels = Array.from({ length: 10 }, (_, index) => ({ title: `Stage ${index + 1}`, purpose: 'Build steadily', milestone: 'Finish the stage', habits: ['Practice'], tasks: ['Review'] }));
    globalThis.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'user-2' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify({ levels }) } }] }) }) as typeof fetch;
    const { result, response } = responseRecorder();
    await handler({ method: 'POST', headers: { authorization: 'Bearer another-valid-token', origin: 'https://odyssey.example' }, body: validInput }, response);

    expect(result.status).toBe(200);
    expect((result.body as { levels: unknown[] }).levels).toHaveLength(10);
    expect(result.headers['Access-Control-Allow-Origin']).toBe('https://odyssey.example');
    expect(JSON.stringify(result.body)).not.toContain('gsk_test_secret');
  });
});
