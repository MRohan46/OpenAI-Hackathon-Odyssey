# Task 030 — Private proof ownership type repair

- **Started:** 2026-07-19 (Asia/Karachi)
- **Goal:** Store private proof images and confirmation records reliably by fixing the Supabase Storage owner comparison used during quest completion.
- **Cadence:** Task 1 of 3.
- **Expected verification:** SQL source inspection, TypeScript/lint, and focused API tests. A new database migration must be applied to the user-controlled Supabase project.

## Root cause

The completion and late-proof RPCs compare `storage.objects.owner_id` to `auth.uid()` as `text = uuid`. In the deployed Storage schema, `owner_id` is text. PostgreSQL rejects that expression, so the RPC rolls back the quest/proof database update after the separate Storage upload succeeds.

## Implementation

- Both proof RPCs now compare `owner_id::text = auth.uid()::text`, which is safe whether Storage exposes owner IDs as text or UUID.
- Added a forward migration for the already deployed project and updated the baseline migration for fresh environments.
- The client now best-effort removes a newly uploaded object when its completion RPC fails, avoiding future orphaned proof images.

## Verification

- `pnpm.cmd typecheck` — passed.
- `pnpm.cmd lint` — passed.
- Focused Jest tests — passed: `mockApi` and `withTimeout` (2 suites, 6 tests).
- `git diff --check` — passed.
- SQL audit confirms every proof ownership check uses the safe text comparison.
