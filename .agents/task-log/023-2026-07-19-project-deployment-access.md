# Task 023 — Project-only Vercel deployment access

- **Started:** 2026-07-19 15:50:33 IST
- **Cadence:** Task 1 of 3
- **Starting branch:** `main`
- **Starting commit:** `b8d62099c03973939bcd0dcbb3dc6ba500436bfa`
- **Goal:** Grant `hameedsajid027@gmail.com` deployment-capable access to the Odyssey Vercel project `dist` only, without granting organization/team-level access.
- **Expected verification:** Resolve the exact Vercel project and team IDs; verify the narrow project role and official project-members endpoint; inspect existing project and team membership; add the user as `PROJECT_DEVELOPER` through the project-only endpoint; re-read project and team membership to prove project access exists and organization-level membership was not added; record, commit, push, and verify the audit note.
- **Scope boundary:** Vercel project `dist` (`prj_O4RTonrWD0xgkTJdSFVf10wDG1zA`) only. Do not call the team invitation endpoint, do not add organization roles or permissions, do not modify other projects, and preserve the unrelated pre-existing untracked task 015 note.

## Progress

- Confirmed from current Vercel documentation that `PROJECT_DEVELOPER` is the narrow project role suited to deployment work and that `POST /v1/projects/{idOrName}/members` adds a member to one project.
- Confirmed the email currently returns no member from the `dist` project-member search.
- Confirmed the same email currently returns no member from the `arjun-science-projects` team-member search.

## Blocked completion — 2026-07-19 15:53:48 IST

- Attempted only the project-scoped endpoint: `POST /v1/projects/prj_O4RTonrWD0xgkTJdSFVf10wDG1zA/members` with email `hameedsajid027@gmail.com` and role `PROJECT_DEVELOPER`.
- Vercel rejected the request with HTTP 400: `The provided user is not a confirmed member of the team.` No invitation or membership was created.
- Verified through the official Vercel RBAC documentation that true project-only access requires the team-level `Contributor` role plus a project-specific role such as `Project Developer`. Vercel documents Contributor and project-level roles as Enterprise-only features.
- Read the live team record and confirmed `arjun-science-projects` is on the `hobby` plan, so it cannot create the required Contributor plus Project Developer assignment.
- Re-ran both membership searches after the failed request: the email remains absent from the `dist` project and absent from the organization/team member results.
- Deliberately did not call `POST /v2/teams/{teamId}/members`, because a normal team invitation would broaden access beyond this project and violate the user's explicit instruction.

### Outcome

- **Access granted:** No.
- **Organization access granted:** No.
- **Project state changed:** No.
- **Blocking condition:** The current Vercel Hobby plan does not support project-scoped Contributor roles.
- **Safe resolution:** Upgrade the Vercel team to an Enterprise plan, then invite the email as `CONTRIBUTOR` with only project `dist` assigned as `PROJECT_DEVELOPER`. Any team-wide Developer or Member invitation would be a different, broader authorization and must not be inferred.

### Verification level

- External access-control inspection and post-attempt membership verification completed.
- No application files changed, so code lint, typecheck, tests, build, deployment, and live product smoke were not applicable.
