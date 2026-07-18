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
