# Task 008 — Vercel preview white-screen recovery

- **Started:** 2026-07-18 17:48:19 IST
- **Cadence:** Task 2 of 3
- **Starting branch:** `main`
- **Goal:** Reproduce and fix the white screen at the hosted Odyssey preview, redeploy a working preview, and verify meaningful rendered content and navigation in a real browser.
- **Expected verification:** Vercel build/runtime inspection; browser screenshot, console, network and accessibility snapshot; focused code/build checks if a source fix is required; explicit Preview redeployment; remote commit verification for any repository changes.
- **Scope boundary:** Do not change backend configuration, promote another production deployment, delete existing deployments, or weaken the verified Today experience.

## Completion

- **Completed:** 2026-07-18 18:06:16 IST
- **Root cause:** The original CLI deployment uploaded `dist/` directly. Vercel recursively excluded the generated `assets/node_modules` tree, so all six runtime font requests returned 404. `RootLayout` waited for both font hooks forever and returned `null`, producing a real white screen after Vercel Authentication was bypassed.
- **Fix:** Added `vercel.json` so Vercel installs dependencies and runs `npm run export:web` from repository source, preserving every generated font and asset in the configured `dist` output. Updated `RootLayout` to continue with platform font fallbacks if a future custom-font request fails instead of permanently returning an empty tree. Added `.vercel/` to `.gitignore` for the local project link.
- **Local verification:** `npm run typecheck`; `npm run lint`; `npm test -- --runInBand` — 4 suites and 9 tests passed; `npm run export:web` passed and emitted all required fonts.
- **Deployment verification:** Explicit Preview `dist-cfrwkle1t-arjun-science-projects.vercel.app` reached Ready after a successful source build. A seven-day Vercel shareable link was generated for external access; its bypass value is intentionally not stored in the repository.
- **Browser verification:** A clean browser rendered the welcome screen, loaded the application bundle and all six fonts with HTTP 200, and navigated through Explore the demo to `/today`. The hosted Today accessibility tree exposed all four quests, the route dropdown, navigation tabs and Begin quest. Evening mobility jumped to scroll position 506; Begin quest reached `/quest/quest-calculus/complete`.
- **Residual note:** Three.js reports its existing `THREE.Clock` deprecation and a normal WebGL context-loss message when leaving the 3D welcome scene. Neither produced a browser error, blank screen, or broken interaction.
