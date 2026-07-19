# Task 020 — Production thunder audio repair

- **Started:** 2026-07-19 13:05:02 IST
- **Cadence:** Task 1 of 3
- **Starting branch:** `main`
- **Starting commit:** `e994e3168a4d2b5d4f09da5accb8039d250000c6`
- **Goal:** Repair the silent production thunder sound while restoring the cinematic visual timeline to its exact pre-audio execution path. Do not alter any animation duration, spacing, haze, hammer motion, lightning timing, copy, or route behavior.
- **Expected verification:** Production runtime/log inspection; managed isolated browser media/network evidence; exact visual-timer source comparison against `624dbfa`; focused audio tests; lint; TypeScript; production export; commit, push, production deployment, and remote/deployment verification.
- **Scope boundary:** Thunder playback implementation and tests only, plus the task log. Any solution that guarantees sound by adding a new visible gate or changing the opening flow requires user approval and is outside this repair.
