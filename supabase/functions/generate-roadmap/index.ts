const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Intensity = 'light' | 'normal' | 'intense';
type RoadmapRequest = {
  goalTitle: string;
  deadline: string;
  startingPoint: string;
  availableDays: string[];
  minutesPerDay: number;
  preferredIntensity: Intensity;
  constraints: string;
};

const validIntensity = (value: unknown): value is Intensity => value === 'light' || value === 'normal' || value === 'intense';
const text = (value: unknown, maximum: number) => typeof value === 'string' ? value.trim().slice(0, maximum) : '';

function validate(input: unknown): RoadmapRequest | null {
  if (!input || typeof input !== 'object') return null;
  const value = input as Record<string, unknown>;
  const goalTitle = text(value.goalTitle, 180);
  const deadline = text(value.deadline, 10);
  const minutesPerDay = Number(value.minutesPerDay);
  const availableDays = Array.isArray(value.availableDays)
    ? value.availableDays.filter((day): day is string => typeof day === 'string').map((day) => day.slice(0, 12)).slice(0, 7)
    : [];
  if (!goalTitle || !/^\d{4}-\d{2}-\d{2}$/.test(deadline) || !Number.isInteger(minutesPerDay) || minutesPerDay < 1 || minutesPerDay > 1440 || !validIntensity(value.preferredIntensity)) return null;
  return { goalTitle, deadline, minutesPerDay, availableDays, preferredIntensity: value.preferredIntensity, startingPoint: text(value.startingPoint, 2_000), constraints: text(value.constraints, 2_000) };
}

function normalizeRoadmap(input: RoadmapRequest, candidate: unknown) {
  const source = candidate && typeof candidate === 'object' ? candidate as Record<string, unknown> : {};
  const levels = Array.isArray(source.levels) ? source.levels : [];
  if (levels.length !== 10) throw new Error('The planning service returned an incomplete roadmap.');
  return {
    ...input,
    levels: levels.map((raw, index) => {
      const level = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
      const number = index + 1;
      const bossType = number === 10 ? 'final' : [3, 6, 8].includes(number) ? 'mini' : 'none';
      const strings = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').map((item) => item.trim().slice(0, 180)).filter(Boolean).slice(0, 8) : [];
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

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return Response.json({ message: 'Method not allowed.' }, { status: 405, headers: corsHeaders });

  // Keep Verify JWT enabled for this function in Supabase. The platform rejects an
  // invalid token before this handler runs; this guard rejects a missing token.
  const authorization = request.headers.get('Authorization');
  if (!authorization) return Response.json({ message: 'Sign in to generate a roadmap.' }, { status: 401, headers: corsHeaders });
  try {
    const input = validate(await request.json().catch(() => null));
    if (!input) return Response.json({ message: 'Please provide a title, a valid deadline, available time, and an intensity.' }, { status: 422, headers: corsHeaders });

    const groqKey = Deno.env.get('GROQ_API_KEY');
    if (!groqKey) {
      console.error('Roadmap request stopped: GROQ_API_KEY is missing.');
      return Response.json({ message: 'Roadmap generation is not configured yet. Add GROQ_API_KEY in Edge Function Secrets.' }, { status: 503, headers: corsHeaders });
    }
    const model = Deno.env.get('GROQ_MODEL') ?? 'llama-3.3-70b-versatile';
    const prompt = `You are Odyssey's careful planning assistant. Build a realistic, editable ten-level roadmap. Never claim certainty, prescribe unsafe health advice, or activate anything. Return only JSON with a levels array containing exactly 10 objects: title, purpose, milestone, bossName, habits (array of strings), tasks (array of strings). Levels 3, 6, 8 need achievable mini-boss milestones and level 10 needs a final-boss milestone.\n\nUser context:\n${JSON.stringify(input)}`;
    console.log('Roadmap request accepted.', { model, titleLength: input.goalTitle.length });

    const controller = new AbortController();
    const upstreamTimeout = setTimeout(() => controller.abort(), 110_000);
    let groqResponse: Response;
    try {
      console.log('Calling Groq chat completions.');
      groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, temperature: 0.45, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'Return valid JSON only.' }, { role: 'user', content: prompt }] }),
        signal: controller.signal,
      });
    } catch (error) {
      console.error('Groq request failed before a response.', error instanceof Error ? error.message : String(error));
      return Response.json({ message: 'The planning service did not respond in time. Please try again.' }, { status: 504, headers: corsHeaders });
    } finally {
      clearTimeout(upstreamTimeout);
    }

    if (!groqResponse.ok) {
      const errorBody = await groqResponse.text();
      console.error('Groq rejected roadmap generation.', { status: groqResponse.status, body: errorBody.slice(0, 500) });
      return Response.json({ message: `Groq could not generate a roadmap (HTTP ${groqResponse.status}). Check the model name and API key.` }, { status: 502, headers: corsHeaders });
    }
    console.log('Groq returned a roadmap response.');
    const payload = await groqResponse.json();
    const content = payload?.choices?.[0]?.message?.content;
    return Response.json(normalizeRoadmap(input, JSON.parse(content)), { headers: corsHeaders });
  } catch (error) {
    console.error('Roadmap function failed before returning a proposal.', error instanceof Error ? error.message : String(error));
    return Response.json({ message: 'Roadmap generation could not complete. Check Edge Function Logs for the safe error detail.' }, { status: 500, headers: corsHeaders });
  }
});
