# Task 014 — Supabase environment diagnosis

- **Started:** 2026-07-19 (Asia/Karachi)
- **Cadence position:** task 2 of 3
- **Goal:** Diagnose why the real Supabase authentication client reports that it is not configured.
- **Expected verification:** Inspect environment variable names without reading values, verify the Expo client configuration contract, and remove any credential from tracked example configuration.

## Evidence

- `.env` exists but defines only `Project_URL` and `Project_API_KEY`; Expo application code receives only `EXPO_PUBLIC_*` variables.
- The configured URL uses a REST endpoint suffix, but Supabase client initialization requires the project root URL.
- `.env.example` contained a real credential and must never do so.

## Resolution

- Restored `.env.example` to safe placeholders.
- The user must rename the two local `.env` entries and use the Supabase project root URL before the Expo bundle can initialize the client.
- Official Expo documentation confirms that only statically referenced `EXPO_PUBLIC_*` variables are inlined into application code.
