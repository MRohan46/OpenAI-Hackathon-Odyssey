# Task 009 — Public Vercel preview access

- **Started:** 2026-07-18 18:32:39 IST
- **Cadence:** Task 3 of 3
- **Starting branch:** `main`
- **Goal:** Remove Vercel Authentication from the Odyssey preview project so teammates can open the plain deployment URL without a Vercel account or bypass query string, while preserving the working app and frontend behavior.
- **Expected verification:** Inspect and update the live project protection setting through the authenticated Vercel API; verify the plain deployment URL in a clean browser; run the repository's full defined suite for this cadence task; commit, push, and remotely verify this task log.
- **Scope boundary:** Do not alter application functionality, backend configuration, deployment contents, domains, or source UI. Do not expose Vercel credentials or store access tokens in the repository.

## Progress

- Confirmed `main` starts clean and matches `origin/main` at `85f5660`.
- Confirmed the linked Vercel project is `dist` (`prj_O4RTonrWD0xgkTJdSFVf10wDG1zA`) under `arjun-science-projects` (`team_645Cg3giT93KBnQejq5Vqh1G`).
- The first read-only Vercel identity check was blocked by sandbox DNS (`ENOTFOUND api.vercel.com`); retrying with approved network access is required.
- Live inspection confirmed Vercel Authentication is enabled as Standard Protection (`ssoProtection.deploymentType = all_except_custom_domains`).
- A project-wide disable request was stopped before execution because it would expose every existing and future deployment URL in `dist`, not only the current Odyssey demo. The live setting remains unchanged.
- A hostname-only Deployment Protection Exception would be safer, but Vercel documents that feature as unavailable on this Hobby project (Enterprise or Pro with the paid Advanced Deployment Protection add-on only).
- The user explicitly approved disabling Vercel Authentication for the entire `dist` project after the blast radius was explained.

## Completion

- **Completed:** 2026-07-18 18:43:14 IST
- **Live setting changed:** Updated the existing Vercel project through the authenticated project API with `{"ssoProtection": null}`. The mutation response and an independent readback both reported `ssoProtection: null`; no deployment, source UI, backend, domain, environment variable, or application data was changed.
- **Public-access verification:** Opened `https://dist-cfrwkle1t-arjun-science-projects.vercel.app/` from a newly created headless Chrome profile with no Vercel account session, share-link query, or bypass token. The document returned HTTP 200 with zero authentication redirects and routed to `/welcome`.
- **Rendered-app verification:** The Welcome screen rendered meaningful Odyssey copy and its three calls to action. The application bundle, Living Shore poster, and all six requested runtime fonts returned HTTP 200. There was no error overlay and no browser console error.
- **Flow verification:** Activated `Explore the demo`; `/today` rendered the Tide Observatory roadmap with all four quests, notifications, quest navigator, Create Quest, roadmap level, Study Boss health, Begin Quest, and all four navigation tabs. The browser reported no console error after navigation.
- **Browser-tool fallback:** The packaged `agent-browser` executable was unavailable, the preconfigured Chrome MCP initially had no running debugging target, and Firefox MCP processes exited before navigation. Verification continued with a clean local headless Chrome process connected through Chrome DevTools; screenshots were inspected at `/tmp/odyssey-public-welcome-loaded.png` and `/tmp/odyssey-public-today.png`.
- **Cadence suite:** `npm run typecheck` passed; `npm run lint` passed; `npm test` passed (4 suites, 9 tests); `npm run export:web` passed and emitted the web bundle and required assets.
- **Security boundary:** This change removes only Vercel's deployment-level login gate. Odyssey's application-level privacy contract and future backend authorization remain separate responsibilities; no Supabase, proof-image, Groq, authentication, or row-level-access configuration was touched.
