# Task 022 — Production roadmap deployment

- **Started:** 2026-07-19 15:34:16 IST
- **Cadence:** Task 3 of 3
- **Starting branch:** `main`
- **Starting commit:** `4d57bf539d2e12c753fe2bb928b8a2795c6b4a68`
- **Goal:** Publish the verified infinite Today quest roadmap to the existing Vercel production project and confirm it is live at `https://dist-arjun-science-projects.vercel.app/`.
- **Expected verification:** Confirm linked Vercel project and production target; run the full task-cadence lint, TypeScript, Jest, and web-export gates; deploy to production; inspect deployment status and alias; verify the deployed Today experience at a mobile viewport with interaction and console checks; review production error logs when available; record the exact deployment, commit, and remote state.
- **Scope boundary:** Deployment and verification only. Do not change application behavior, environment variables, Supabase state, notification configuration, or unrelated files. Preserve the pre-existing untracked task 015 note.

## Progress

- Confirmed the repository is linked to Vercel project `dist` under project ID `prj_O4RTonrWD0xgkTJdSFVf10wDG1zA`.
- Confirmed `vercel.json` exports Expo web through `npm run export:web`, serves `dist`, and rewrites application routes to the single-page entry point.
- Confirmed local `main` matches `origin/main` at `4d57bf539d2e12c753fe2bb928b8a2795c6b4a68`; the unrelated untracked task 015 note remains outside this deployment task.

## Completion — 2026-07-19 15:46:34 IST

- Deployed the current linked project to the Vercel production target with `vercel deploy . --prod -y`.
- Vercel deployment `dpl_FJrBhM87TZgDEdgRae1uBVn81B4Y` completed with status `Ready` and target `production`.
- Vercel independently reported the requested alias `https://dist-arjun-science-projects.vercel.app` on that exact deployment. The immutable deployment URL is `https://dist-7d9zg1805-arjun-science-projects.vercel.app`.
- The remote Vercel build completed its Expo web export in approximately two minutes and bundled all 43 assets, including the 504 KB road triptych and both transparent dragon decorations.

### Full cadence verification

- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm test -- --runInBand` — passed: 9 suites, 19 tests.
- `npm run export:web` — passed locally: 3,783 modules and 43 assets exported.
- Vercel remote build — passed: production output deployed and aliased.
- `vercel inspect dist-7d9zg1805-arjun-science-projects.vercel.app` — target `production`, status `Ready`, and the exact requested alias present.
- Production browser smoke at 390x844 — passed through the public `Explore the living world` presentation path. Today rendered at the requested alias with `bodyWidth` and `documentWidth` both 390, one road triptych, the live quest route, both dragon decorations, and no error overlay.
- Production interaction smoke — passed: the navigator exposed all four quests; selecting `Calculus Focus Session` closed the navigator and scrolled `today-roadmap-scroll` to 1,488 px.
- Production asset requests — passed: the road triptych and both dragon PNGs returned HTTP 200.
- Production browser console — clean; no console errors, warnings, or issues.
- `vercel logs dpl_FJrBhM87TZgDEdgRae1uBVn81B4Y --no-follow --level error --since 1h` — no runtime logs found, which is expected for this static Expo export and does not replace the browser/network evidence above.

### Confirmed pre-existing production gap

- A fresh unauthenticated visit to `/today` correctly follows the product guard to `/welcome`. `Explore the living world` enters the working presentation experience and exposes the new Today roadmap.
- The normal sign-in path remains unavailable because the Vercel project has no production environment variables. The UI reports missing `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `vercel env ls production` independently returned `No Environment Variables found`.
- This task did not invent, copy, or expose Supabase credentials. Restoring authenticated production access requires the real project values and a separate authorized environment/configuration change.

### Git state

- Application deployment source: `4d57bf539d2e12c753fe2bb928b8a2795c6b4a68` on `main`.
- This deployment record is the only file created by task 022 and will be committed and pushed separately. The unrelated untracked task 015 note remains untouched.
