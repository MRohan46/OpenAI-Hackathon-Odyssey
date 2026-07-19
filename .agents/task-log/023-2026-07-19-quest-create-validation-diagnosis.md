# Task 023 — Quest creation validation diagnosis

- **Started:** 2026-07-19 (Asia/Karachi)
- **Goal:** Identify why the supplied quest form submission remains on the validation error.
- **Cadence:** Task 3 of 3.
- **Verification:** Read-only trace of `app/quest/new.tsx` and the quest creation contract.

## Finding

The supplied title and duration pass validation. The generic validation branch can only be reached here when the Connected Odyssey has no selected active goal ID (or the scheduled local date/time is invalid). The supplied date/time is valid, so the missing `goalId` is the cause. A real-data account needs at least one accepted goal with `status = 'active'`; draft and completed goals are intentionally excluded.

