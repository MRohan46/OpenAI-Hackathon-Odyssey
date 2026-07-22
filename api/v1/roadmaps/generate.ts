import { z } from 'zod';

type HeaderValue = string | string[] | undefined;

interface ApiRequest {
  method?: string;
  headers: Record<string, HeaderValue>;
  body?: unknown;
}

interface ApiResponse {
  status(code: number): ApiResponse;
  setHeader(name: string, value: string): void;
  json(body: unknown): void;
  end(): void;
}

const day = z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
const inputSchema = z.object({
  goalTitle: z.string().trim().min(6).max(180),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
    const [year, month, date] = value.split('-').map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, date));
    return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === date;
  }),
  startingPoint: z.string().trim().max(2_000),
  availableDays: z.array(day).min(1).max(7).refine((days) => new Set(days).size === days.length),
  minutesPerDay: z.number().int().min(10).max(1_440),
  preferredIntensity: z.enum(['light', 'normal', 'intense']),
  constraints: z.string().trim().max(2_000),
}).strict();

type RoadmapInput = z.infer<typeof inputSchema>;

const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 10 * 60_000;
const RATE_LIMIT = 5;

function header(value: HeaderValue) {
  return Array.isArray(value) ? value[0] : value;
}

function allowedOrigin(request: ApiRequest) {
  const origin = header(request.headers.origin);
  if (!origin) return null;
  const configured = new Set((process.env.ALLOWED_ORIGINS ?? '').split(',').map((value) => value.trim()).filter(Boolean));
  const host = header(request.headers['x-forwarded-host']) ?? header(request.headers.host);
  const protocol = header(request.headers['x-forwarded-proto']) ?? 'https';
  return configured.has(origin) || (host && origin === `${protocol}://${host}`) ? origin : false;
}

function setResponseHeaders(response: ApiResponse, origin: string | null) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('Vary', 'Origin');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  if (origin) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Client-Request-Id');
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.setHeader('Access-Control-Max-Age', '86400');
  }
}

function parseBody(body: unknown) {
  if (typeof body !== 'string') return body;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

async function authenticatedUser(authorization: string) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !publishableKey) throw new Error('Supabase authentication is not configured.');

  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
    headers: { apikey: publishableKey, Authorization: authorization },
    redirect: 'error',
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) return null;
  const user = await response.json().catch(() => null);
  return typeof user?.id === 'string' ? user.id : null;
}

function isRateLimited(userId: string) {
  const now = Date.now();
  const current = rateLimits.get(userId);
  if (!current || current.resetAt <= now) {
    rateLimits.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  current.count += 1;
  // ponytail: per-instance limit; replace with a shared store if cross-instance abuse becomes measurable.
  return current.count > RATE_LIMIT;
}

function text(value: unknown, maximum: number) {
  return typeof value === 'string' ? value.trim().slice(0, maximum) : '';
}

function normalizeRoadmap(input: RoadmapInput, candidate: unknown) {
  const source = candidate && typeof candidate === 'object' ? candidate as Record<string, unknown> : {};
  const levels = Array.isArray(source.levels) ? source.levels : [];
  if (levels.length !== 10) throw new Error('Incomplete roadmap response.');

  return {
    ...input,
    levels: levels.map((raw, index) => {
      const level = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
      const number = index + 1;
      const bossType = number === 10 ? 'final' : [3, 6, 8].includes(number) ? 'mini' : 'none';
      const strings = (value: unknown) => Array.isArray(value)
        ? value.filter((item): item is string => typeof item === 'string').map((item) => item.trim().slice(0, 180)).filter(Boolean).slice(0, 8)
        : [];
      return {
        id: crypto.randomUUID(),
        number,
        title: text(level.title, 120) || `Level ${number}`,
        purpose: text(level.purpose, 700),
        status: number === 1 ? 'active' : 'locked',
        milestone: text(level.milestone, 700),
        bossType,
        bossName: bossType === 'none' ? undefined : text(level.bossName, 120) || (bossType === 'final' ? input.goalTitle : `Trial of Level ${number}`),
        bossHealth: bossType === 'none' ? undefined : 100,
        habits: strings(level.habits),
        tasks: strings(level.tasks),
      };
    }),
  };
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  const origin = allowedOrigin(request);
  setResponseHeaders(response, origin || null);

  if (origin === false) return response.status(403).json({ message: 'Origin is not allowed.' });
  if (request.method === 'OPTIONS') return response.status(204).end();
  if (request.method !== 'POST') return response.status(405).json({ message: 'Method not allowed.' });

  const contentLength = Number(header(request.headers['content-length']) ?? 0);
  if (!Number.isFinite(contentLength) || contentLength > 16_384) return response.status(413).json({ message: 'Request is too large.' });

  const authorization = header(request.headers.authorization);
  if (!authorization?.startsWith('Bearer ') || authorization.length < 16) return response.status(401).json({ message: 'Sign in to generate a roadmap.' });

  let userId: string | null;
  try {
    userId = await authenticatedUser(authorization);
  } catch {
    console.error('Roadmap authentication service is unavailable.');
    return response.status(503).json({ message: 'Authentication is temporarily unavailable.' });
  }
  if (!userId) return response.status(401).json({ message: 'Sign in to generate a roadmap.' });
  if (isRateLimited(userId)) return response.status(429).json({ message: 'Too many roadmap requests. Please try again in a few minutes.' });

  const parsed = inputSchema.safeParse(parseBody(request.body));
  if (!parsed.success) return response.status(422).json({ message: 'Provide a valid goal, deadline, available days, time, and intensity.' });

  const groqKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  if (!groqKey) {
    console.error('Roadmap generation is missing GROQ_API_KEY.');
    return response.status(503).json({ message: 'Roadmap generation is not configured.' });
  }

  const prompt = `You are Odyssey's careful planning assistant. Build a realistic, editable ten-level roadmap. Never claim certainty, prescribe unsafe health advice, or activate anything. Return only JSON with a levels array containing exactly 10 objects: title, purpose, milestone, bossName, habits (array of strings), tasks (array of strings). Levels 3, 6, 8 need achievable mini-boss milestones and level 10 needs a final-boss milestone.\n\nUser context:\n${JSON.stringify(parsed.data)}`;

  try {
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, temperature: 0.45, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'Return valid JSON only.' }, { role: 'user', content: prompt }] }),
      redirect: 'error',
      signal: AbortSignal.timeout(110_000),
    });
    if (!groqResponse.ok) {
      console.error('Groq rejected roadmap generation.', { status: groqResponse.status });
      return response.status(502).json({ message: 'The planning service could not generate a roadmap.' });
    }
    const payload = await groqResponse.json();
    const content = payload?.choices?.[0]?.message?.content;
    return response.status(200).json(normalizeRoadmap(parsed.data, JSON.parse(content)));
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError');
    console.error(timedOut ? 'Roadmap generation timed out.' : 'Roadmap generation failed safely.');
    return response.status(timedOut ? 504 : 502).json({ message: timedOut ? 'The planning service did not respond in time.' : 'The planning service could not generate a roadmap.' });
  }
}
