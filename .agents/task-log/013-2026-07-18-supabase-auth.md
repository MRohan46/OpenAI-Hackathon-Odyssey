# Task 013 — Supabase authentication

- **Started:** 2026-07-18 (Asia/Karachi)
- **Cadence position:** task 1 of 3
- **Goal:** Replace the presentation-only sign-in and sign-up adapter with Supabase email/password and Google OAuth, securely persist sessions, and block unauthenticated navigation.
- **Expected verification:** Dependency installation, TypeScript, focused auth tests, lint, and a configuration audit. Live provider verification requires the Supabase and Google dashboard configuration plus an interactive device/browser sign-in.

## Initial evidence

- The `.env` file exposes `Project_URL` and `Project_API_KEY` variable names; values were intentionally not read or logged.
- The existing auth flow used an in-memory `signedIn` flag and the mock API adapter.

## Completed implementation

- Added the Supabase client, native Expo SecureStore session persistence, foreground token refresh, session restoration, and auth-state subscription.
- Replaced mock sign-in/sign-up calls with Supabase email/password operations.
- Added Google OAuth with the system browser, custom deep-link callback, authorization-code exchange, and implicit-token compatibility.
- Added public auth-callback routing, protected navigation, signed-in root routing, and sign-out cleanup for in-memory user-owned state.
- Added `.env.example` and `docs/SUPABASE_AUTH_SETUP.md`; existing `Project_URL` and `Project_API_KEY` names must be renamed to Expo's `EXPO_PUBLIC_*` names for a live build.

## Verification

- Focused ESLint: passed for every changed TypeScript/TSX auth file.
- TypeScript: `tsc --noEmit` passed.
- Focused Jest: `mockApi.test.ts` passed (4/4).
- Live sign-in was not run because it requires the user's Supabase Email/Google provider dashboard settings and an interactive device/browser account.
