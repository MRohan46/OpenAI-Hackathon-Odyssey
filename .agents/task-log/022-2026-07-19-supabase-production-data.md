# Task 022 — Supabase production data integration

- **Started:** 2026-07-19 (Asia/Karachi)
- **Goal:** Replace the default mock product-data path with private Supabase-backed data and move Groq roadmap generation behind a Supabase Edge Function.
- **Cadence:** Task 2 of 3.
- **Expected verification:** Migration SQL review, TypeScript typecheck/lint, focused adapter tests; live database deployment requires the project's Supabase CLI login and user approval.

## Safety decision

The existing `EXPO_PUBLIC_GROQ_API_KEY` is unsafe because Expo exposes `EXPO_PUBLIC_*` variables to clients. The production function reads `GROQ_API_KEY` and `GROQ_MODEL` only from Supabase Edge Function secrets.

## Completed locally

- Added Supabase migration, private storage policies, RLS, transactional progress/reward RPCs, and a JWT-protected Groq roadmap function.
- Switched configured app builds to hydrate Supabase data; presentation mode explicitly retains the mock demonstration state.
- `npm.cmd run typecheck` and `npm.cmd run lint` pass. Focused mock API and analytics tests pass.
- The complete Jest suite has two pre-existing timezone-sensitive display assertion failures in this Windows runner; they are unrelated to the Supabase path.

## Deployment blocker

No Supabase CLI executable or linked project metadata is present in the workspace, so the remote migration/function was not deployed. The required `supabase link`, `db push`, secrets, and function deployment commands are documented in `docs/SUPABASE_PRODUCTION_IMPLEMENTATION.md`.
