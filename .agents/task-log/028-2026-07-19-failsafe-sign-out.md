# Task 028 — Fail-safe sign out

- **Started:** 2026-07-19 (Asia/Karachi)
- **Goal:** Make logout immediately clear the local Odyssey session and navigate to the welcome screen even when the remote Supabase request cannot complete.
- **Cadence:** Task 2 of 3.
- **Expected verification:** Focused TypeScript, lint, and auth-flow source review.

## Root cause

The settings action awaited the default Supabase sign-out request before it cleared state or navigated. A stalled or rejected remote request prevented every local logout step from running.
