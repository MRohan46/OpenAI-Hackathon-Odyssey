# Task 006 — Scrollable Today roadmap promotion

- **Started:** 2026-07-18 15:03:44 IST
- **Cadence:** Task 3 of 3
- **Starting branch:** `experiment/tide-observatory-today`
- **Goal:** Promote Tide Observatory to the production Today screen without utility loss by showing every quest on a scrollable shoreline roadmap, retaining complete quest metadata and preserving the prior card-based Today UI as a rollback component.
- **Expected verification:** Focused Today tests; every-quest and expansion-state interaction coverage; accessibility and reduced-motion checks; 390 × 844 and 320 × 700 browser captures; source-versus-implementation design QA; full cadence lint, typecheck, unit tests, web export, live browser smoke; remote experiment and `main` verification.
- **Scope boundary:** Preserve quest, progress, reward, notification, scheduling, completion, and persistence contracts. Do not delete the former Today implementation. Do not change backend behavior.
- **Promotion rule:** Commit and verify the experiment first, then merge into and push `main` only after the complete cadence suite passes.

## Completion

- **Completed:** 2026-07-18 16:09:08 IST
- **Implementation:** Replaced the experiment's three-node/overflow treatment with a data-driven, vertically scrollable shoreline route that renders every quest exactly once. Added truthful side metadata, a direct-jump `Today's route` dropdown, responsive compact positioning, and a continuous long-route scene plate. Preserved the former card-based Today screen as `LegacyTodayScreen` with a commented route rollback switch.
- **Contract safety:** No backend, persistence, reward, schedule, completion, notification, or navigation contract was changed. Scheduled, upcoming, completed, overdue, planned-intensity, actual-intensity, XP, rubies, boss-damage, recurrence, and proof-policy data remain distinct.
- **Focused verification:** `npm test -- --runInBand __tests__/TodayScreen.test.tsx` — 2 tests passed.
- **Cadence verification:** `npm run typecheck`; `npm run lint`; `npm test -- --runInBand` — 4 suites and 9 tests passed; `npm run export:web` — production web export passed.
- **Live verification:** Production export checked at 390 × 844 and 320 × 700. `Begin quest` reached the completion route; the dropdown listed all four quests and jumped to Evening mobility; all quest cards were named in the accessibility tree; no browser application errors or console warnings were reported.
- **Motion verification:** Reduced-motion screenshots captured two seconds apart had identical SHA-256 hashes: `045503ac29a81f0bb83731bf3fd617ac380f0fb1bf5e04e0488fc3448b5e1881`.
- **Design verification:** Source-versus-implementation comparison and top, full-roadmap, navigator, and responsive captures are indexed in `qa/tide-observatory/README.md`; all P0/P1/P2 findings are resolved in `design-qa.md`.
- **Environment note:** Expo development mode can terminate when its watcher observes the ephemeral `.codex` directory and React Native DevTools cannot launch the host Chrome sandbox. Final runtime proof therefore used the stable exported production bundle.
