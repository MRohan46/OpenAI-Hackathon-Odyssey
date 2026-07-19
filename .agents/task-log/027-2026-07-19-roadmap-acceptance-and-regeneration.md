# Task 027 — Roadmap acceptance and regeneration repair

- **Started:** 2026-07-19 (Asia/Karachi)
- **Goal:** Make reviewed roadmaps persist through Supabase with actionable errors, and ensure both proposal and level regeneration use the protected Groq path.
- **Cadence:** Task 1 of 3.
- **Expected verification:** Focused TypeScript, lint, and Jest checks; manual Supabase smoke instructions because the hosted project is user-controlled.

## Evidence before editing

- The review screen discarded the error returned by `odyssey_accept_roadmap`, so a database failure was indistinguishable from every other failure.
- “Regenerate only this level” only replaced the level with fixed local strings; it did not call the configured Edge Function or Groq.
- Clearing the proposal after acceptance triggered the review screen effect that generated a new example proposal, creating an unnecessary race while navigating to the activated goal.
