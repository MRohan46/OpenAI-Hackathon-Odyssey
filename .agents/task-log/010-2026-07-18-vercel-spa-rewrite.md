# Task 010 — Vercel SPA deep-link rewrite

- **Started:** 2026-07-18 18:46:26 IST
- **Cadence:** Task 1 of 3
- **Starting branch:** `main`
- **Goal:** Add the requested Vercel SPA fallback so direct Odyssey page URLs serve Expo's `index.html` and client-side routing can resolve the screen.
- **Expected verification:** Official Vercel configuration confirmation; JSON/schema validation; Expo web export; focused local routing check if practical; Preview deployment readiness; commit, push, and remote commit verification.
- **Scope boundary:** Change only deployment routing configuration and the required task log. Do not modify application screens, backend contracts, Supabase, Groq, authentication, or product behavior.

## Progress

- Confirmed `main` starts clean and matches `origin/main` at `5374054`.
- Confirmed the existing `vercel.json` configures the Expo web export but has no SPA fallback rewrite.
- Official Vercel project-configuration documentation uses the exact requested `/(.*)` to `/index.html` rewrite for single-page applications and confirms filesystem assets take precedence over rewrites.
- Added the requested catch-all rewrite after the existing framework, build-command, and output-directory settings.
- Direct JSON/contract validation passed and `npm run export:web` completed successfully with all expected Expo assets.
- `npx -y @vercel/config validate` was not applicable to this JSON-backed project: the current tool searched for an unrelated `router.config.ts` and exited before reading `vercel.json`. This failed attempt is not treated as configuration evidence.
- The first `vercel build` attempt correctly stopped because local Preview project settings had not been pulled. After `vercel pull --yes --environment=preview`, the linked Vercel build completed successfully.
- `.vercel/output/config.json` confirms Vercel compiled the route in the correct order: filesystem handling first, then `^(?:/(.*))$` to `/index.html`. Existing JavaScript, images, fonts, and other emitted files therefore remain directly addressable while unknown application paths fall back to the SPA shell.

## Completion

- **Completed:** 2026-07-18 18:53:07 IST
- **Source change:** `vercel.json` now contains the requested `rewrites` array with `source: "/(.*)"` and `destination: "/index.html"`; no application code or backend contract changed.
- **Focused validation:** Direct JSON and route-contract check passed; `npm run export:web` passed; linked `vercel build` passed and generated the expected filesystem-first SPA fallback in `.vercel/output/config.json`.
- **Deployment:** Public Preview `https://dist-1vwn8slp6-arjun-science-projects.vercel.app` completed successfully as Vercel deployment `dpl_DjmErU6rPdT315ybdJuaCrkAcYZo`. Independent `vercel inspect` reported target `preview` and status `Ready`.
- **Direct routes:** The deployed catch-all is intended to make links such as `https://dist-1vwn8slp6-arjun-science-projects.vercel.app/today` resolve through Expo Router instead of returning Vercel's filesystem 404.
- **Live-smoke boundary:** No external HTTP/browser fetch was issued against the fresh deployment during the deployment handoff. Evidence consists of Vercel's compiled route output, successful server build/deployment, and independent Ready inspection; direct-link interaction remains the final consumer check.
- **Verification level:** Focused deployment-routing verification, appropriate for cadence task 1 of 3. The previous cadence's full suite passed immediately before this task; no TypeScript or product-runtime source changed here.

## Redeployment follow-up

- A collaborator updated `main` in commit `9078b4c` after the first Preview deployment, replacing `/(.*)` to `/index.html` with `/:path*` to `/`. The first attempt to push this log was rejected as non-fast-forward; the collaborator's commit was preserved and this log was rebased on top without a force-push.
- The user reported the prior attempt did not work and explicitly requested redeployment of the current rewrite.
- Redeployed the current `main` configuration as public Preview `https://dist-npzsi5mt2-arjun-science-projects.vercel.app`.
- Vercel's server build completed successfully and emitted all 36 assets. Independent `vercel inspect` reported deployment `dpl_GGgC5FXp2uWbqpW8Zf12TVJ9nm8D`, target `preview`, status `Ready`.
- Direct nested-route behavior is not claimed as proven until a consumer opens a nested URL on this exact new Preview; successful deployment and Ready status alone do not prove client-side route recovery.
