# Task 024 — Roadmap timeout recovery

- **Started:** 2026-07-19 (Asia/Karachi)
- **Goal:** Prevent the AI roadmap generation screen from loading forever when Supabase or Groq is unavailable.
- **Cadence:** Task 1 of 3.
- **Expected verification:** Focused timeout unit tests, TypeScript, and lint.

## Completed

- The mobile request now has a 20-second terminal timeout and an actionable error/retry state.
- The Edge Function aborts its Groq request after 25 seconds and returns a `504` response.
- Typecheck, lint, and focused timeout/mock-adapter tests pass.
