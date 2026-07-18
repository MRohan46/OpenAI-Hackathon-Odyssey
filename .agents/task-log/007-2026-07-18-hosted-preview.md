# Task 007 — Hosted Odyssey preview

- **Started:** 2026-07-18 16:37:00 IST
- **Completed:** 2026-07-18 17:44:44 IST
- **Cadence:** Task 1 of 3
- **Starting branch:** `main`
- **Goal:** Publish the verified static Odyssey frontend as a shareable preview without changing backend contracts or promoting a production deployment.
- **Expected verification:** Confirm the deployment command returns a preview URL; do not treat an upload or branch push alone as a live deployment.
- **Attempted path:** The Vercel CLI rejected the machine's expired token. The skill's unauthenticated deployment endpoint has been retired and now returns CLI login instructions rather than a deployment. The verified `dist` export was also pushed to remote branch `gh-pages` at `7ce56258647e2c95db21965939f67df8a5e427a2`, but GitHub rejected Pages enablement because the logged-in `ScientificAJ` collaborator does not have repository administration permission.
- **Authentication:** The user completed Vercel device authentication successfully.
- **Deployment:** `npx -y vercel deploy dist -y --target=preview --force` completed successfully and Vercel returned Ready preview `https://dist-8k8g1xckm-arjun-science-projects.vercel.app` plus inspection page `https://vercel.com/arjun-science-projects/dist/GiaWchj6zWW1YMdJ8EZLuy8KLVeu`.
- **Production caveat:** The first authenticated `vercel deploy dist -y` invocation was unexpectedly classified by the previously linked `dist` project as Production even though no `--prod` flag was supplied. A separate explicit Preview deployment was then created and is the only URL handed off for team review. No production promotion command was run afterward.
- **Current state:** Hosted preview complete. Backend configuration was untouched; the deployed files are the previously verified static `dist` export.
