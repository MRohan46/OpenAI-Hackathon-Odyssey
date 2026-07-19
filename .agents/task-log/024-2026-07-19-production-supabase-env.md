# Task 024 — Production Supabase environment

- **Started:** 2026-07-19 15:57:35 IST
- **Cadence:** Task 2 of 3
- **Starting branch:** `main`
- **Starting commit:** `d799a2d60f186b7b08fee6e75bddc4efd2b33831`
- **Goal:** Load the user-provided environment file at `/home/aru/Downloads/sweety backup/env` into the linked Vercel project `dist`, rebuild production so the Expo client receives the Supabase configuration, and verify the deployed authentication boundary without exposing or committing credentials.
- **Expected verification:** Inspect key names and value classifications without printing values; reject any client-side secret/service-role key; add only the validated variables to Vercel Production; confirm Vercel lists both names for Production; redeploy; verify READY status and requested alias; exercise production sign-in far enough to prove the missing-configuration guard is gone; review console/network evidence; record, commit, push, and remotely verify this audit note.
- **Scope boundary:** Vercel project `dist`, Production environment only. Do not copy values into the repository or logs, do not add Preview/Development variables, do not change Supabase schema/auth/RLS, and preserve the unrelated pre-existing untracked task 015 note.

## Progress

- Confirmed the source is an ASCII CRLF environment file containing exactly `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Validated without printing values that the URL is non-empty HTTPS on a Supabase host.
- Decoded only the JWT role claim and confirmed the supplied legacy key is `anon`, not `service_role`; it is therefore suitable for the public Expo client when protected by correct RLS.
- Reviewed the current Supabase key guidance and relevant breaking-change index. Legacy `anon` remains client-safe and functional, but should be migrated to `sb_publishable_...` before its planned late-2026 retirement.

## Completion — 2026-07-19 16:02:23 IST

- Added `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the linked Vercel project `dist` with the `Production` target only. Vercel lists both values as encrypted.
- Did not print either value, copy the source environment file, create a repository `.env`, or add the values to Preview or Development.
- Rebuilt and deployed production so Expo's static web bundle received the new build-time values.
- Vercel deployment `dpl_BSp2scWV5F61BjNc7rfpAaQ5K1dK` completed with status `Ready`, target `production`, and immutable URL `https://dist-61576q50g-arjun-science-projects.vercel.app`.
- Vercel confirmed `https://dist-arjun-science-projects.vercel.app` is an alias of that exact deployment.

### Production verification

- Opened the requested production alias in a fresh isolated browser context and followed `Enter your journey` to `/sign-in`.
- Confirmed the previous `Supabase is not configured` message is absent.
- Submitted the synthetic prefilled placeholder account. The browser issued a real `POST` to the configured Supabase `/auth/v1/token?grant_type=password` endpoint and received HTTP 400 with the user-facing `Invalid login credentials` response, proving the client URL/key are present and Supabase Auth is reachable without claiming the fictional credentials should authenticate.
- Confirmed there is no Expo error overlay.
- The browser recorded the expected failed-resource console entry for the intentionally invalid login request and one existing `aria-hidden` focus warning during the welcome-to-sign-in transition. The accessibility warning is unrelated to environment configuration and was not expanded into a UI change in this task.
- Vercel remote build passed: Expo exported 3,782 modules and all 43 assets in approximately two minutes.

### Verification and risk notes

- The supplied key is a legacy client-safe `anon` key. Security still depends on correct Supabase RLS policies; no schema or policy change was made or implied.
- Supabase's current migration guidance recommends replacing legacy `anon` with a new `sb_publishable_...` key before legacy-key retirement in late 2026.
- Local lint, typecheck, Jest, and export were not rerun because no application or dependency file changed; the immediately preceding cadence task already passed the full suite, and this task's only build was independently completed by Vercel with the new environment.
- Application deployment source remained `d799a2d60f186b7b08fee6e75bddc4efd2b33831`; this task-log record is committed and pushed separately.
