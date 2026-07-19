# Task 029 — Authentication session hardening

- **Started:** 2026-07-19 (Asia/Karachi)
- **Goal:** Make password, Google, and callback authentication commit a usable local session before protected-route navigation, without blocking Supabase's auth event handler.
- **Cadence:** Task 3 of 3.
- **Expected verification:** Full frontend typecheck, lint, and Jest suite; focused auth-flow review.

## Root cause

The auth-state listener awaited profile, goals, quests, rewards, and preferences requests inside the Supabase callback. This can delay or deadlock auth propagation. Password and callback screens also navigated to protected routes before independently confirming that the local app state had committed the new session. The forms further prefilled fake credentials that are invalid in a real Supabase project.

## Implementation

- Session state now commits synchronously from the auth listener; account hydration is deferred and versioned so stale responses cannot repopulate a signed-out account.
- Password sign-in, sign-up with immediate session, Google sign-in, and email-link callbacks explicitly apply or confirm the session before routing.
- Google and callback exceptions now become visible user-facing errors instead of an indefinite loader.
- Real login and signup forms now begin blank rather than suggesting non-existent demo credentials.

## Verification

- `pnpm.cmd typecheck` — passed.
- `pnpm.cmd lint` — passed.
- Focused test run — passed: `WelcomeScreen`, `mockApi`, and `withTimeout` (3 suites, 8 tests).
- `git diff --check` — passed.
- Full Jest cadence was attempted. Eight suites passed; two pre-existing timezone-sensitive formatting assertions failed because this machine formats `2026-07-17T19:00:00+05:30` as `6:30 PM` instead of the test's fixed `7:00 PM`. Neither failing file was changed by this task.
