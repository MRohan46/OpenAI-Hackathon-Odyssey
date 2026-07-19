# Task 017 — Production Vercel deployment

- **Started:** 2026-07-19 11:33:53 IST
- **Cadence:** Task 1 of 3
- **Starting branch:** `main`
- **Starting commit:** `89263fa34fcba9c6a5a10cb009112cd295264f49`
- **Goal:** Deploy the verified First Island hero to the existing Vercel project and preserve the requested production URL `https://dist-npzsi5mt2-arjun-science-projects.vercel.app/`.
- **Expected verification:** Confirm the existing `.vercel/project.json` linkage, run the repository production deployment command, verify Vercel reports the requested production alias, and confirm Git remains scoped. Per the Vercel deployment workflow, do not fetch the deployed URL after deployment.
- **Scope boundary:** Deployment and its required task log only. Do not create another Vercel project, alter the domain, change application code, or stage the unrelated pre-existing task 015 note.

## Completion

- **Completed:** 2026-07-19 11:38:58 IST
- **Status:** The First Island build deployed successfully to the existing `arjun-science-projects/dist` production project. The exact requested hostname cannot be reassigned because Vercel identifies it as the immutable URL of an older preview deployment rather than a project alias.
- **Production deployment:** `dpl_KxtPm9BXmva3wav3DwqqHFiHR3o7`, status `Ready`, deployment URL `https://dist-nwjqp5wel-arjun-science-projects.vercel.app`.
- **Stable production URL:** `https://dist-arjun-science-projects.vercel.app` points to the new production deployment. Vercel also attached the project's existing production aliases.
- **Exact URL investigation:** `https://dist-npzsi5mt2-arjun-science-projects.vercel.app` is preview deployment `dpl_GGgC5FXp2uWbqpW8Zf12TVJ9nm8D` from 2026-07-18. `vercel alias set` rejected reassignment with `The chosen alias ... is a deployment URL.` Vercel deployment URLs are not movable aliases.
- **Verification:** `vercel deploy . --prod -y` completed successfully; the remote build installed the locked dependencies, ran `npm run export:web`, bundled 3,761 modules, deployed the output, and reported the production deployment `Ready`. `vercel inspect` confirmed the deployment ID, production target, ready status, and stable aliases. Per the deployment workflow, no HTTP fetch was made against the deployed site.
- **Scope preserved:** No application or Vercel configuration files changed. The unrelated pre-existing task 015 note remains untouched.
