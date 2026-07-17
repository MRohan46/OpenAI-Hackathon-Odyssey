# Odyssey Frontend Scope and Coverage Contract

**Status:** Active build contract

This document maps the product specification to frontend routes, interactive
states, and replaceable backend boundaries. It does not define backend behavior
or alter the product rules in [PRODUCT.md](PRODUCT.md).

## Backend boundary

The frontend will:

- Render every product surface with realistic synthetic data.
- Provide working local navigation, forms, filters, controls, and presentation
  state.
- Persist demo preferences and draft state locally where useful.
- Define typed API contracts and environment-configurable endpoint paths.
- Keep a mock adapter available for design, testing, and offline demonstration.
- Treat server-confirmed responses as authoritative for completion, rewards,
  boss health, and accepted roadmaps.

The frontend will not:

- Implement authentication services, databases, row-level security, storage
  policy, AI generation, notification delivery infrastructure, or reward
  calculation services.
- Embed Supabase service credentials, Groq credentials, private keys, or real
  personal data.
- Pretend a local visual animation is a successful backend mutation.

## Route inventory

### Entry and account presentation

| Route | Purpose | Required states |
| --- | --- | --- |
| `/` | Resolve the local presentation session | loading, first-run, returning |
| `/welcome` | Odyssey introduction and primary entry actions | default, reduced motion |
| `/sign-in` | Sign-in form wired to the auth endpoint contract | idle, invalid, submitting, error |
| `/sign-up` | Account-creation form wired to the auth endpoint contract | idle, invalid, submitting, error |

### Goal and roadmap creation

| Route | Purpose | Required states |
| --- | --- | --- |
| `/goal/new` | Capture destination, deadline, starting point, availability, effort, and constraints | draft, validation, submitting |
| `/roadmap/generating` | Explain protected AI generation without implying activation | generating, slow, failed |
| `/roadmap/review` | Review and edit the proposed ten-level roadmap before acceptance | proposal, editing, reorder, regenerate, accept pending, failure |
| `/goal/[goalId]` | Show one active Odyssey and its roadmap | active, complete, empty stage |
| `/goal/[goalId]/edit` | Edit goal presentation fields through endpoint contracts | draft, validation, saving, failure |
| `/roadmap/level/[levelId]` | Show stage purpose, connected quests, milestone, and boss state | normal level, mini-boss, final boss, completed |

### Daily work and proof

| Route | Purpose | Required states |
| --- | --- | --- |
| `/(tabs)/today` | Priority-driven Daily Quest Board | scheduled, completed, upcoming, overdue, missed, empty, offline |
| `/quest/new` | Create a habit or one-time task | habit, task, recurrence, deadline, priority, intensity, proof policy |
| `/quest/[questId]` | Inspect, edit, reschedule, or remove a quest | scheduled, in progress, completed, overdue, missed |
| `/quest/[questId]/complete` | Record actual intensity and optional/required proof | ready, proof required, submitting, confirmed, failed |
| `/proof/capture` | Capture or choose private proof for the active completion draft | permission, camera/library, preview, unavailable |

### Calendar and reminders

| Route | Purpose | Required states |
| --- | --- | --- |
| `/(tabs)/calendar` | Odyssey month/week/day schedule surface | month, week, selected day, empty, loading |
| `/notifications` | In-app reminder inbox | unread, read, empty |
| `/settings/reminders` | Device and in-app reminder presentation preferences | permission unknown, allowed, denied, saving |

### Journeys, bosses, and rewards

| Route | Purpose | Required states |
| --- | --- | --- |
| `/(tabs)/journey` | Switch among multiple active and completed Odysseys | active, completed, empty |
| `/rewards` | Separate XP, account level, rubies, chests, boosts, streak protection, and cosmetics | available, empty, locked |
| `/rewards/chest/[chestId]` | Present an earned chest and its confirmed contents | closed, opening, confirmed, failed |

### Analytics

| Route | Purpose | Required states |
| --- | --- | --- |
| `/analytics` | Account-level progress and trends | week, month, loading, empty |
| `/analytics/habit/[habitId]` | Scheduled versus completed, streak, intensity, misses, and proof history | normal, empty |
| `/analytics/goal/[goalId]` | Level, boss, connected quest, and deadline progress | active, complete, empty |

### Profile, settings, and trust

| Route | Purpose | Required states |
| --- | --- | --- |
| `/(tabs)/profile` | Account level, identity presentation, cosmetics, and shortcuts | default, cosmetic selected |
| `/settings` | Application preferences and account presentation controls | default, saving |
| `/settings/accessibility` | Motion, haptics, contrast, and graphics quality preferences | system, custom |
| `/settings/privacy` | Plain-language ownership, proof privacy, AI authority, and endpoint status | default |

## Shared overlays and sheets

- Quest quick actions.
- Date and time picker.
- Priority picker.
- Planned and actual intensity picker.
- Recurrence editor.
- Proof-policy picker.
- Missed and overdue explanation.
- Completion result.
- Reward result.
- Boss-stage explanation.
- Endpoint-unavailable and offline recovery.

## Navigation contract

- Today, Journey, Calendar, and Profile are the persistent root destinations.
- Every secondary route has a visible native back action and platform back
  support.
- Navigation must complete even when world-camera animation is disabled,
  interrupted, or unavailable.
- Deep routes must render with synthetic or endpoint-provided identifiers; they
  cannot depend on an earlier screen remaining mounted.
- The current draft is preserved while the user temporarily visits proof or
  recurrence controls.

## Endpoint families

The frontend adapter exposes these replaceable families:

- `auth`: session, sign in, sign up, sign out.
- `profile`: read and update presentation profile and preferences.
- `goals`: list, create, read, update, archive.
- `roadmaps`: generate proposal, edit proposal, regenerate, accept, read levels.
- `quests`: list occurrences, create, read, update, reschedule, remove, complete.
- `proof`: request upload target, attach proof metadata, read private proof URL.
- `rewards`: read balances and inventory, open earned chest, apply eligible boost.
- `analytics`: overall, habit, and goal read models.
- `notifications`: inbox and reminder preferences.

Every mutating method must distinguish:

- idle
- pending
- confirmed success
- recoverable failure
- stale/late success after navigation
- stale/late failure after navigation

## Product-semantic checks

The frontend is incomplete if it blurs any of these pairs:

- scheduled occurrence versus habit definition
- scheduled versus completed versus missed versus overdue
- planned intensity versus actual intensity
- habit streak versus overall Odyssey streak
- account level versus roadmap level
- XP versus rubies
- roadmap progress versus boss health
- generated proposal versus accepted active roadmap
- optional proof versus required proof
- local preview versus confirmed persisted result

## Coverage evidence

Implementation is considered covered only when each route above has:

1. A real Expo Router route.
2. A coherent Living Shore composition.
3. Working primary controls using mock or endpoint-adapter data.
4. Loading, empty, and failure behavior where data is involved.
5. Accessibility labels and reduced-motion behavior.
6. A test or representative end-to-end smoke path proportional to its risk.
