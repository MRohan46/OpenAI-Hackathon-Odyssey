# Task 016 — First Island hero rebuild

- **Started:** 2026-07-19 10:20:45 IST
- **Cadence:** Task 3 of 3
- **Starting branch:** `main`
- **Starting commit:** `9647eb76e19d193322eb4c69d9861f80a78314d5`
- **Goal:** Rebuild Odyssey's welcome hero as an award-caliber, game-like first island using the supplied left/right creature references, the existing Living Shore world, layered responsive motion, and truthful native navigation without changing product behavior.
- **Expected verification:** Full cadence suite because this is task 3: asset validation, focused welcome behavior checks, authored-source lint, TypeScript, Jest, web export, browser-rendered 390 x 844 and desktop hero inspection, reduced-motion verification, console/network inspection, design QA, git diff checks, commit, push, and remote commit verification.
- **Scope boundary:** Welcome/hero presentation, its dedicated visual component, related visual assets, focused tests, design QA evidence, and this task note. Preserve all sign-up, sign-in, and demo routes. Do not alter progress, reward, auth, Supabase, Groq, or roadmap semantics. Leave the pre-existing untracked task 015 note untouched.

## Completion

- **Completed:** 2026-07-19 10:59:46 IST
- **Status:** Implemented and verified; awaiting commit/push at the time of this log update.
- **Delivered:** Replaced the generic welcome stack with a responsive First Island world composition using the existing coastal-route plate, the two supplied left/right creatures as cleaned transparent companions, an editable-route progression rail, and live sign-up/sign-in/demo controls.
- **Motion:** Added staged brand/copy/control entrance, opposing companion float/tilt, slow backdrop drift, horizon breathing, pointer-responsive WebGL camera motion, 36 drift particles, 11 haze volumes, three route rings, three light shafts, and three route shards. Reduced motion stops loops, and unsupported WebGL falls back to the complete poster/native-motion hero without an error or blank region.
- **Responsive proof:** Exact browser metrics showed no horizontal overflow at 320, 390, or 1440 px. The two decision-critical actions fit within 390 × 844 and 320 × 700. The third demo action remains reachable with a short scroll on mobile.
- **Interaction proof:** Trusted production-browser input passed `Choose your first goal` → `/sign-up`, `Enter your journey` → `/sign-in`, and `Explore the living world` → `/today` with no application console errors. After rebasing over the new Supabase auth commit, the explicit demo action was integrated as a separate tab-scoped presentation session limited to the synthetic Today screen. A second production-browser security smoke proved that attempting to open protected Profile from that session redirects to `/welcome`.
- **Design QA:** `design-qa.md` records the source/implementation comparison, WebGL P0 capability fix, compact-layout P2 fix, and final `passed` result. Evidence is in `.agents/audits/hero-2026-07-19/`.
- **Verification passed:** `npm run typecheck`; `npm test -- --runInBand` (8 suites, 17 tests); `pnpm exec eslint app src __tests__`; focused final TypeScript/Jest/ESLint rerun; `npm run export:web` (3,762 modules after the auth integration rebase, production export); asset alpha/corner checks; exact 390 × 844, 320 × 700, 1440 × 900, reduced-motion, WebGL, WebGL-fallback, and production-browser captures; `git diff --check`.
- **Known repository gate issue:** `npm run lint` still scans generated `.vercel/output` bundles and fails with the same pre-existing 20,239 generated-file findings (11,288 errors, 8,951 warnings) recorded in task 014. Authored `app`, `src`, and `__tests__` lint is clean.
- **Scope preserved:** No progress, reward, Supabase, Groq, roadmap-authority, or authenticated navigation semantics changed. The auth gate distinguishes a real signed-in account from an explicit, tab-scoped presentation session and permits that presentation session only on the synthetic Today screen. The pre-existing untracked task 015 note remains untouched and will not be staged.
