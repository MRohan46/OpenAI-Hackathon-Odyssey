# Odyssey Backend API Integration Guide

**Status:** implementation handoff
**API version:** `/v1`
**Frontend snapshot:** `main` at `0c75af7`
**Reviewed:** 2026-07-18

This guide is derived from the current Expo frontend, not from a hypothetical backend. It covers all 30 route/layout files, every source component and hook, the application provider, both API adapters, all typed contracts, mock data, tests, and the product/backend-boundary documents.

The current frontend declares **31 HTTP method/path contracts**. Some are already called by screens through `AppProvider`; some exist only in the live/mock adapters; several screens still read seeded mock state. The backend should implement the complete declared surface below, while frontend integration must close the gaps identified in [Missing Backend Features](#missing-backend-features).

## 1. What the frontend actually does today

| Area | Current source | Live endpoint status |
| --- | --- | --- |
| Sign in, sign up, sign out | `AppProvider` → selected API adapter | Called |
| Profile, goals, quests, rewards, notifications bootstrap | Seeded `src/data/mockData.ts` state | Endpoints declared but not called on app start |
| Preferences | AsyncStorage plus profile preferences mutation | PATCH called; server GET not called |
| AI roadmap generation/acceptance | `AppProvider` | Called |
| Goal edit | `AppProvider` | Called |
| Quest create/reschedule/delete/complete | `AppProvider` | Called |
| Proof upload and private retrieval | Local image picker URI | Three endpoints declared but not called |
| Chest opening | `AppProvider` | Called |
| Boost application | Display-only UI | Endpoint declared but not called |
| Cosmetic selection | Local state mutation only | Endpoint declared but not called |
| Analytics | Static exports from `mockData.ts` | Three endpoints declared but not called |
| Notification inbox | Seeded state; mark-read mutation | List endpoint not called; mark-read called |
| Reminder preferences | AsyncStorage/profile preferences PATCH | Dedicated GET/PATCH endpoints declared but not called |

## 2. Critical integration facts

1. **Successful HTTP responses must be the raw domain object.** `liveApi.ts` casts the response JSON directly to `T`. Do not wrap success payloads in `{ "success": true, "data": ... }` unless the frontend adapter is changed first.
2. **Errors must include a top-level `message`.** The adapter currently reads only `payload.message`.
3. **Every request sends `X-Client-Request-Id`.** Echo it as `X-Request-Id` and in error JSON for traceability.
4. **Bearer authentication is required for every endpoint except sign-in and sign-up, but is not attached yet.** `AppProvider` discards the returned `accessToken`; `liveApi.ts` has no `Authorization` header. Backend implementation can proceed, but protected calls will return `401` until the frontend stores and attaches the token.
5. **The server owns progress.** XP, rubies, boss damage/health, streaks, quest completion state, roadmap progress, chests, and unlocks must be calculated transactionally on the server. The create-quest UI currently sends suggested reward numbers; never trust them.
6. **Roadmap generation is a proposal.** `POST /roadmaps/generate` must not create a goal or schedule quests. Only `POST /roadmaps/accept` activates the reviewed draft.
7. **Proof is private.** Store proof in a private Supabase Storage bucket, use owner-prefixed object keys, and return short-lived signed upload/read URLs only.
8. **`proofUri` needs a production interpretation.** In the current completion contract it may contain a local `file://` URI, which a backend cannot read. For live traffic it must mean the private Storage `objectKey` returned by the upload-target endpoint. The frontend still needs wiring to upload before completion.

## 3. Transport conventions

### Base URL

The Expo client uses:

```text
${EXPO_PUBLIC_API_BASE_URL}/v1/...
```

`EXPO_PUBLIC_API_BASE_URL` must not end with `/`; the frontend removes one trailing slash if supplied.

### Request headers

Unauthenticated auth requests:

```http
Content-Type: application/json
X-Client-Request-Id: <uuid>
```

All user-owned routes:

```http
Authorization: Bearer <Supabase access JWT>
Content-Type: application/json
X-Client-Request-Id: <uuid>
```

The signed upload itself uses the exact headers returned by `POST /v1/proof/upload-target`, normally `Content-Type` and any Supabase signing headers. It does not use the API bearer token unless the generated target explicitly requires it.

### Success format

Return the resource directly:

```json
{
  "id": "goal_01J...",
  "title": "Prepare for my mathematics examination"
}
```

For a successful operation with no response resource, return JSON `null` with `200 OK`. The current adapter always calls `response.json()`, so `204 No Content` will throw and be reported as an offline failure.

### Error format

Use this envelope for every non-2xx response:

```json
{
  "message": "Human-readable explanation.",
  "code": "validation",
  "retryable": false,
  "requestId": "8cf3153d-73c9-4cd4-98e9-d8d45bf437df",
  "fieldErrors": {
    "email": "Enter a valid email."
  }
}
```

`fieldErrors` is optional. The current UI displays `message`; structured fields are safe for future form improvements.

| Status | Code | Standard example JSON |
| --- | --- | --- |
| `400 Bad Request` | `validation` | `{"message":"The request is invalid.","code":"validation","retryable":false,"requestId":"req_123"}` |
| `401 Unauthorized` | `unauthorized` | `{"message":"Sign in to continue.","code":"unauthorized","retryable":false,"requestId":"req_123"}` |
| `403 Forbidden` | `forbidden` | `{"message":"You cannot access this resource.","code":"forbidden","retryable":false,"requestId":"req_123"}` |
| `404 Not Found` | `not_found` | `{"message":"The resource could not be found.","code":"not_found","retryable":false,"requestId":"req_123"}` |
| `409 Conflict` | `conflict` | `{"message":"The action conflicts with the current state.","code":"conflict","retryable":false,"requestId":"req_123"}` |
| `413 Payload Too Large` | `validation` | `{"message":"The proof image is too large.","code":"validation","retryable":false,"requestId":"req_123"}` |
| `422 Unprocessable Content` | `validation` | `{"message":"The submitted fields could not be accepted.","code":"validation","retryable":false,"requestId":"req_123"}` |
| `429 Too Many Requests` | `rate_limited` | `{"message":"Too many requests. Try again shortly.","code":"rate_limited","retryable":true,"requestId":"req_123"}` |
| `500 Internal Server Error` | `server` | `{"message":"Odyssey could not confirm this request.","code":"server","retryable":true,"requestId":"req_123"}` |
| `503 Service Unavailable` | `server` | `{"message":"The service is temporarily unavailable.","code":"server","retryable":true,"requestId":"req_123"}` |

> Adapter limitation: today, only `401` and `404` map to their typed frontend codes. `400`, `403`, `409`, `413`, `422`, and `429` are flattened to `server`. The backend should still return correct HTTP statuses; the frontend mapping should be fixed.

### Identifier, date, and numeric rules

- IDs: opaque UUID/ULID strings; never accept a user ID in a body to establish ownership.
- Timestamps: RFC 3339/ISO 8601 with offset on input, UTC with `Z` on output.
- Date-only deadlines: `YYYY-MM-DD` in the user's local calendar.
- Percentages and boss health: integers from `0` through `100`.
- Durations: integer minutes.
- All strings are trimmed server-side; reject control characters and unreasonably large values.
- Every list and resource query is scoped to `auth.uid()` regardless of the identifier supplied.

## 4. Canonical response objects

These are the exact shapes consumed by the frontend. Optional fields may be omitted; do not return different field names or snake_case without changing the adapter.

### UserProfile

```json
{
  "id": "user_01J...",
  "name": "Mira",
  "handle": "@mira",
  "accountLevel": 4,
  "xp": 840,
  "xpToNextLevel": 1200,
  "overallStreak": 14,
  "avatarSeed": "mira-ocean",
  "selectedCosmetic": "Sunwake Trail"
}
```

### RoadmapLevel

```json
{
  "id": "level_01J...",
  "number": 1,
  "title": "Build the foundation",
  "purpose": "Establish a reliable baseline.",
  "status": "active",
  "milestone": "Complete the first diagnostic set.",
  "bossType": "none",
  "habits": ["Review formulas three days a week"],
  "tasks": ["Complete a diagnostic paper"]
}
```

For boss levels, `bossType` is `mini` or `final`, with optional `bossName` and `bossHealth` (`0..100`). Exactly ten levels are expected after generation and acceptance; level numbers are unique `1..10`; mini-bosses are levels `3`, `6`, and `8`; the final boss is level `10`.

### Goal

```json
{
  "id": "goal_01J...",
  "title": "Prepare for my mathematics examination",
  "shortTitle": "Mathematics examination",
  "description": "I know the foundations and need timed practice.",
  "deadline": "2026-09-25",
  "currentLevel": 1,
  "progress": 42,
  "accent": "#FFC72C",
  "status": "active",
  "bossName": "The Final Shore",
  "bossHealth": 62,
  "roadmap": []
}
```

`roadmap` contains ten `RoadmapLevel` objects. `currentLevel`, `progress`, `status`, and `bossHealth` are server-derived.

### Quest

```json
{
  "id": "quest_01J...",
  "goalId": "goal_01J...",
  "title": "Calculus focus session",
  "description": "Timed differentiation practice.",
  "kind": "habit",
  "status": "scheduled",
  "scheduledAt": "2026-07-18T19:00:00+05:30",
  "deadlineAt": "2026-07-18T20:15:00+05:30",
  "durationMinutes": 45,
  "priority": "high",
  "plannedIntensity": "intense",
  "recurrence": "Mon,Wed,Fri",
  "proofPolicy": "optional",
  "rewardXp": 90,
  "rewardRubies": 12,
  "bossDamage": 7
}
```

Enums:

- `kind`: `habit | task`
- `status`: `scheduled | inProgress | completionPending | completed | upcoming | overdue | missed`
- `priority`: `low | medium | high | critical`
- `plannedIntensity` and optional `actualIntensity`: `light | normal | intense`
- `proofPolicy`: `required | optional | none`

`actualIntensity`, `proofUri`, and `completedAt` appear after completion. The server must never persist `completionPending`; it is an optimistic client-only state.

### RewardInventory

```json
{
  "rubies": 386,
  "unopenedChests": 1,
  "boosts": [
    {"id":"boost_focus","name":"Focus Tide","description":"A presentation inventory boost.","quantity":2}
  ],
  "cosmetics": [
    {"id":"cos_sunwake","name":"Sunwake Trail","description":"Golden wake effect.","unlocked":true,"selected":true}
  ],
  "streakProtection": 1
}
```

### NotificationItem

```json
{
  "id": "notification_01J...",
  "title": "Quest begins soon",
  "body": "Calculus Focus Session begins in 15 minutes.",
  "createdAt": "2026-07-18T13:15:00.000Z",
  "read": false,
  "kind": "scheduled"
}
```

`kind`: `scheduled | deadline | overdue | reward`.

## 5. Endpoint contracts

Unless stated otherwise, every endpoint requires `Authorization: Bearer <JWT>`, `Content-Type: application/json`, and `X-Client-Request-Id`; URL/query parameters are absent; and resources are owner-scoped.

### Authentication

#### POST `/v1/auth/sign-in`

**Purpose:** Authenticate the sign-in form and return the initial profile with a session token.
**Authentication:** No authentication.
**Database models:** Supabase `auth.users`, `profiles`.

**Request body**

```json
{"email":"mira@example.com","password":"correct horse battery staple"}
```

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| `email` | string | yes | Valid email; trim and lowercase; frontend uses `z.email()` |
| `password` | string | yes | Minimum 6 characters in current sign-in UI; do not trim |

**Example request**

```http
POST /v1/auth/sign-in
Content-Type: application/json
X-Client-Request-Id: 8cf3153d-73c9-4cd4-98e9-d8d45bf437df

{"email":"mira@example.com","password":"correct horse battery staple"}
```

**Success — `200 OK`**

```json
{
  "accessToken": "<supabase-access-jwt>",
  "user": {
    "id":"user_01J...","name":"Mira","handle":"@mira","accountLevel":1,
    "xp":0,"xpToNextLevel":500,"overallStreak":0,"avatarSeed":"mira-ocean","selectedCosmetic":""
  }
}
```

**Errors:** `400` malformed input `{"message":"Enter a valid email and password.","code":"validation","retryable":false,"requestId":"req_123"}`; `401` invalid credentials `{"message":"Email or password is incorrect.","code":"unauthorized","retryable":false,"requestId":"req_123"}`; `429` rate limit `{"message":"Too many sign-in attempts. Try again shortly.","code":"rate_limited","retryable":true,"requestId":"req_123"}`; `500` `{"message":"Odyssey could not sign you in.","code":"server","retryable":true,"requestId":"req_123"}`.

**Frontend files:** `app/sign-in.tsx`; `src/state/AppProvider.tsx`; `src/api/liveApi.ts`; `src/api/mockApi.ts`; `src/api/endpoints.ts`; `src/api/contracts.ts`.

#### POST `/v1/auth/sign-up`

**Purpose:** Create an account/profile from the registration form, then send the user into goal creation.
**Authentication:** No authentication.
**Database models:** Supabase `auth.users`, `profiles`, `app_preferences`, `reward_accounts`.

**Request body**

```json
{"name":"Mira","email":"mira@example.com","password":"correct horse battery staple"}
```

**Example request:** `POST /v1/auth/sign-up` with the JSON body above and the unauthenticated headers in [Request headers](#request-headers).

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| `name` | string | yes | Trimmed; 2–80 characters |
| `email` | string | yes | Valid email; trim/lowercase; unique identity |
| `password` | string | yes | Minimum 8 characters in current UI; enforce provider password policy |

**Success — `201 Created`** uses the same `Session` shape as sign-in. If email confirmation is enabled, this contract cannot honestly return an immediately usable access token; either disable mandatory confirmation for the hackathon flow or update the frontend for a confirmation-pending response.

```json
{
  "accessToken":"<supabase-access-jwt>",
  "user":{"id":"user_01J...","name":"Mira","handle":"@mira","accountLevel":1,"xp":0,"xpToNextLevel":500,"overallStreak":0,"avatarSeed":"mira-ocean","selectedCosmetic":""}
}
```

**Errors:** `400` invalid fields `{"message":"Complete every field with a valid email and 8-character password.","code":"validation","retryable":false,"requestId":"req_123"}`; `409` email exists `{"message":"An account already uses this email.","code":"conflict","retryable":false,"requestId":"req_123"}`; `429` `{"message":"Too many account attempts. Try again shortly.","code":"rate_limited","retryable":true,"requestId":"req_123"}`; `500` `{"message":"Odyssey could not create the account.","code":"server","retryable":true,"requestId":"req_123"}`.

**Frontend files:** `app/sign-up.tsx`; `src/state/AppProvider.tsx`; `src/api/liveApi.ts`; `src/api/mockApi.ts`; `src/api/endpoints.ts`; `src/api/contracts.ts`.

#### POST `/v1/auth/sign-out`

**Purpose:** Revoke/end the current presentation session when Settings signs out.
**Authentication:** Bearer token; user only.
**Request body:** none.
**Success — `200 OK`:** `null`.
**Database models:** Supabase auth refresh/session records; no application row required.

**Example request**

```http
POST /v1/auth/sign-out
Authorization: Bearer <JWT>
Content-Type: application/json
X-Client-Request-Id: req_123
```

**Errors:** `401` `{"message":"This session has already ended.","code":"unauthorized","retryable":false,"requestId":"req_123"}`; `500` `{"message":"Odyssey could not end the session.","code":"server","retryable":true,"requestId":"req_123"}`.

**Frontend files:** `app/settings.tsx`; `src/state/AppProvider.tsx`; `src/api/liveApi.ts`; `src/api/mockApi.ts`; `src/api/endpoints.ts`; `src/api/contracts.ts`.

### Profile and preferences

#### GET `/v1/profile`

**Purpose:** Load the signed-in identity, account level, XP, streak, avatar seed, and selected cosmetic. The Today, Profile, Settings, and completion views depend on this data.
**Authentication:** Bearer token; user only.
**Request body:** none.
**Example request:** `GET /v1/profile` with bearer and request-ID headers.
**Success — `200 OK`:** canonical `UserProfile`.
**Database models:** `profiles`, reward/streak aggregates.

```json
{"id":"user_01J...","name":"Mira","handle":"@mira","accountLevel":4,"xp":840,"xpToNextLevel":1200,"overallStreak":14,"avatarSeed":"mira-ocean","selectedCosmetic":"Sunwake Trail"}
```

**Errors:** `401` standard unauthorized JSON; `404` `{"message":"Profile could not be found.","code":"not_found","retryable":false,"requestId":"req_123"}`; `500` standard server JSON.

**Frontend files:** declared in `src/api/liveApi.ts`, `mockApi.ts`, `endpoints.ts`, `contracts.ts`; intended consumers currently reading seeded state: `app/(tabs)/today.tsx`, `app/(tabs)/profile.tsx`, `app/settings.tsx`, `src/screens/LegacyTodayScreen.tsx`, `src/state/AppProvider.tsx`.

#### PATCH `/v1/profile/preferences`

**Purpose:** Persist accessibility, graphics, haptic, and reminder preferences changed in Settings. The provider sends the complete merged preference object, not a sparse patch.
**Authentication:** Bearer token; user only.
**Database models:** `app_preferences`.

**Request body**

```json
{
  "reducedMotionOverride":"system",
  "haptics":true,
  "highContrast":false,
  "graphicsQuality":"auto",
  "questReminders":true,
  "deadlineReminders":true,
  "overdueReminders":true,
  "reminderLeadMinutes":15
}
```

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| `reducedMotionOverride` | enum | yes | `system | on | off` |
| `haptics` | boolean | yes | — |
| `highContrast` | boolean | yes | — |
| `graphicsQuality` | enum | yes | `auto | full | balanced | calm` |
| `questReminders` | boolean | yes | — |
| `deadlineReminders` | boolean | yes | — |
| `overdueReminders` | boolean | yes | — |
| `reminderLeadMinutes` | integer | yes | Current UI choices: `5`, `15`, `30`, `60`; reject outside `1..1440` |

**Example request:** `PATCH /v1/profile/preferences` with the complete JSON body above.

**Success — `200 OK`:** return the full stored `AppPreferences` object.
**Errors:** `400/422` `{"message":"One or more preferences are invalid.","code":"validation","retryable":false,"requestId":"req_123"}`; `401` standard unauthorized; `500` standard server JSON.

**Frontend files:** `app/settings/accessibility.tsx`; `app/settings/reminders.tsx`; `src/components/Button.tsx`; `src/hooks/useReducedMotion.ts`; `src/state/AppProvider.tsx`; API adapter/contract files.

### Goals

#### GET `/v1/goals`

**Purpose:** Load all of the user's active, completed, and draft Odysseys with embedded roadmap levels for Journey, Today, Calendar relationships, Profile shortcuts, analytics navigation, and quest creation.
**Authentication:** Bearer token; user only.
**Query parameters:** none in the current adapter.
**Request body:** none.
**Example request:** `GET /v1/goals` with bearer and request-ID headers.
**Success — `200 OK`:** `Goal[]`, ordered active first then most recently updated. Empty result is `[]`.
**Database models:** `goals`, `roadmap_levels`, `roadmap_level_suggestions`.

```json
[
  {"id":"goal_01J...","title":"Prepare for my mathematics examination","shortTitle":"Mathematics examination","description":"Timed practice","deadline":"2026-09-25","currentLevel":4,"progress":42,"accent":"#FFC72C","status":"active","bossName":"Study Boss","bossHealth":62,"roadmap":[]}
]
```

**Errors:** `401` standard unauthorized; `500` `{"message":"Odyssey could not load your journeys.","code":"server","retryable":true,"requestId":"req_123"}`.

**Frontend files:** declared in API files; intended seeded-state consumers: `app/(tabs)/today.tsx`, `journey.tsx`, `calendar.tsx`, `profile.tsx`, `app/goal/[goalId]/*`, `app/quest/new.tsx`, `app/roadmap/level/[levelId].tsx`, analytics routes, `src/screens/LegacyTodayScreen.tsx`, `src/state/AppProvider.tsx`.

#### GET `/v1/goals/:goalId`

**Purpose:** Resolve a goal deep link independently of previous navigation and return its entire roadmap.
**Authentication:** Bearer token; owner only.
**URL parameters:** `goalId` — required opaque goal ID.
**Request body:** none.
**Success — `200 OK`:** canonical `Goal`.
**Database models:** `goals`, `roadmap_levels`, `roadmap_level_suggestions`.

**Example request:** `GET /v1/goals/goal_01J...`
**Errors:** `401` standard unauthorized; `403` standard forbidden if policy distinguishes ownership (returning `404` is safer against enumeration); `404` `{"message":"Odyssey could not be found.","code":"not_found","retryable":false,"requestId":"req_123"}`; `500` standard server JSON.

**Frontend files:** declared in API files; intended consumers `app/goal/[goalId]/index.tsx`, `app/goal/[goalId]/edit.tsx`, `app/analytics/goal/[goalId].tsx`, and deep-link bootstrap in `src/state/AppProvider.tsx` (not implemented yet).

#### POST `/v1/goals`

**Purpose:** Create a goal from an already prepared `RoadmapDraft`. This contract exists independently, while the current user flow normally calls roadmap acceptance instead.
**Authentication:** Bearer token; user only.
**Database models:** `goals`, `roadmap_levels`, `roadmap_level_suggestions`.

**Request body:** the full `RoadmapDraft` shape shown under roadmap acceptance below. All fields and exactly ten levels are required.
**Example request:** same body as `POST /v1/roadmaps/accept`.
**Success — `201 Created`:** canonical `Goal` with server-generated IDs/defaults.
**Errors:** `400/422` `{"message":"The accepted roadmap is incomplete or invalid.","code":"validation","retryable":false,"requestId":"req_123"}`; `401` standard unauthorized; `409` `{"message":"This roadmap has already been activated.","code":"conflict","retryable":false,"requestId":"req_123"}`; `500` standard server JSON.

**Frontend files:** declared in API adapter/contract files; `mockApi.roadmaps.accept` delegates to it. No route directly calls `goals.create` in live mode.

#### PATCH `/v1/goals/:goalId`

**Purpose:** Save fields exposed by the goal edit screen.
**Authentication:** Bearer token; owner only.
**URL parameters:** `goalId` — required opaque goal ID.
**Database models:** `goals`.

**Request body**

```json
{
  "title":"Prepare for the final mathematics examination",
  "shortTitle":"Mathematics examination",
  "description":"Timed practice with Sundays free.",
  "deadline":"2026-10-02"
}
```

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| `title` | string | optional | If supplied, trim; 1–160 characters; current form rejects blank |
| `shortTitle` | string | optional | If supplied, trim; 1–60 characters; current client derives it from title |
| `description` | string | optional | Maximum 2,000 characters |
| `deadline` | date string | optional | Valid `YYYY-MM-DD` |

Reject or ignore client attempts to patch `id`, `currentLevel`, `progress`, `status`, `bossHealth`, or roadmap state even though the current TypeScript signature is broadly `Partial<Goal>`.

**Example request:** `PATCH /v1/goals/goal_01J...` with the JSON body above.

**Success — `200 OK`:** full updated canonical `Goal`.
**Errors:** `400/422` `{"message":"Keep a clear title and valid deadline.","code":"validation","retryable":false,"requestId":"req_123"}`; `401` standard unauthorized; `404` goal not found JSON; `409` `{"message":"A completed journey cannot be edited this way.","code":"conflict","retryable":false,"requestId":"req_123"}`; `500` standard server JSON.

**Frontend files:** `app/goal/[goalId]/edit.tsx`; `src/state/AppProvider.tsx`; API adapter/contract files.

### AI roadmap proposals

#### POST `/v1/roadmaps/generate`

**Purpose:** Ask the protected server-side Groq integration for an editable ten-level proposal. It must not persist or activate a goal.
**Authentication:** Bearer token; user only.
**Database models:** none required for product state; optional `roadmap_generation_audit` for rate/cost/error metadata without storing secrets.

**Request body**

```json
{
  "goalTitle":"Prepare for my mathematics examination",
  "deadline":"2026-09-25",
  "startingPoint":"I know the foundations but need timed practice.",
  "availableDays":["Mon","Wed","Fri","Sat"],
  "minutesPerDay":45,
  "preferredIntensity":"normal",
  "constraints":"Keep Sunday free."
}
```

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| `goalTitle` | string | yes | Trim; current UI minimum 6; maximum 160 |
| `deadline` | date string | yes | Valid `YYYY-MM-DD` |
| `startingPoint` | string | yes | Trim; maximum 2,000; frontend permits empty but backend should accept empty as `""` |
| `availableDays` | string[] | yes | At least 1 unique value from `Mon..Sun` |
| `minutesPerDay` | integer | yes | Current UI minimum 10; recommended maximum 1,440 |
| `preferredIntensity` | enum | yes | `light | normal | intense` |
| `constraints` | string | yes | Maximum 2,000; may be empty |

**Example request:** `POST /v1/roadmaps/generate` with the JSON body above.

**Success — `200 OK`:** echo all input fields plus `levels: RoadmapLevel[10]`. Generated level IDs are proposal IDs and may be replaced during acceptance.

```json
{
  "goalTitle":"Prepare for my mathematics examination","deadline":"2026-09-25",
  "startingPoint":"I know the foundations but need timed practice.","availableDays":["Mon","Wed","Fri","Sat"],
  "minutesPerDay":45,"preferredIntensity":"normal","constraints":"Keep Sunday free.",
  "levels":[{"id":"proposal_level_1","number":1,"title":"Build the foundation","purpose":"Establish a baseline.","status":"active","milestone":"Complete a diagnostic.","bossType":"none","habits":["Review formulas"],"tasks":["Complete a diagnostic paper"]}]
}
```

The abbreviated example shows one element; the actual response must contain exactly ten.

**Errors:** `400/422` invalid goal context JSON; `401` standard unauthorized; `429` `{"message":"Roadmap generation is temporarily rate-limited.","code":"rate_limited","retryable":true,"requestId":"req_123"}`; `502` `{"message":"The roadmap provider returned an invalid proposal.","code":"server","retryable":true,"requestId":"req_123"}`; `503` standard unavailable JSON; `500` standard server JSON.

**Frontend files:** `app/roadmap/generating.tsx`; `app/roadmap/review.tsx` (regenerate); `src/state/AppProvider.tsx`; API adapter/contract files; proposal semantics tested in `__tests__/mockApi.test.ts`.

#### POST `/v1/roadmaps/accept`

**Purpose:** Atomically persist the user-reviewed proposal as a new active goal and roadmap. This is the authority boundary between AI suggestion and product state.
**Authentication:** Bearer token; user only.
**Database models:** `goals`, `roadmap_levels`, `roadmap_level_suggestions`.

**Request body**

```json
{
  "goalTitle":"Prepare for my mathematics examination",
  "deadline":"2026-09-25",
  "startingPoint":"I know the foundations but need timed practice.",
  "availableDays":["Mon","Wed","Fri","Sat"],
  "minutesPerDay":45,
  "preferredIntensity":"normal",
  "constraints":"Keep Sunday free.",
  "levels":[
    {
      "id":"proposal_level_1","number":1,"title":"Build the foundation",
      "purpose":"Establish a baseline.","status":"active","milestone":"Complete a diagnostic.",
      "bossType":"none","habits":["Review formulas"],"tasks":["Complete a diagnostic paper"]
    }
  ]
}
```

All seven generation-input fields retain the same rules. `levels` is required with exactly ten items. Each level requires `id`, unique `number 1..10`, `title` (1–160), `purpose` (1–2,000), `status`, `milestone` (1–1,000), `bossType`, `habits` string array, and `tasks` string array. `bossName` and `bossHealth` are optional only where relevant. Normalize acceptance so level 1 is `active`, later levels are `locked`, and boss placement follows levels 3/6/8/10; do not trust generated progress/health.

**Example request:** `POST /v1/roadmaps/accept` with the reviewed JSON body above.

**Success — `201 Created`:** the complete canonical `Goal`.
**Errors:** `400/422` `{"message":"Review all ten roadmap levels before activation.","code":"validation","retryable":false,"requestId":"req_123"}`; `401` standard unauthorized; `409` duplicate acceptance JSON; `500` standard server JSON.
**Idempotency:** use `X-Client-Request-Id` as a short-term idempotency key because the current body has no explicit acceptance mutation ID.

**Frontend files:** `app/roadmap/review.tsx`; `src/state/AppProvider.tsx`; API adapter/contract files; `__tests__/mockApi.test.ts`.

### Quests and completion

#### GET `/v1/quests`

**Purpose:** Load the user's scheduled habit occurrences and one-time tasks for Today, Calendar, roadmap levels, goal detail, quest detail/completion, and analytics navigation.
**Authentication:** Bearer token; user only.
**Query parameters:** none in the current adapter. The current backend contract therefore returns the complete user-owned collection.
**Request body:** none.
**Database models:** `quest_definitions`, `quest_occurrences`, completion summary projection.

**Example request:** `GET /v1/quests` with bearer and request-ID headers.

**Success — `200 OK`:** `Quest[]`, ordered by `scheduledAt`; empty state is `[]`.

```json
[
  {"id":"quest_01J...","goalId":"goal_01J...","title":"Calculus focus session","description":"Timed differentiation practice.","kind":"habit","status":"scheduled","scheduledAt":"2026-07-18T19:00:00+05:30","deadlineAt":"2026-07-18T20:15:00+05:30","durationMinutes":45,"priority":"high","plannedIntensity":"intense","recurrence":"Mon,Wed,Fri","proofPolicy":"optional","rewardXp":90,"rewardRubies":12,"bossDamage":7}
]
```

**Errors:** `401` standard unauthorized; `500` `{"message":"Odyssey could not load your quests.","code":"server","retryable":true,"requestId":"req_123"}`.

**Frontend files:** declared in API files; intended seeded-state consumers: `app/(tabs)/today.tsx`, `app/(tabs)/calendar.tsx`, `app/goal/[goalId]/index.tsx`, `app/roadmap/level/[levelId].tsx`, `app/quest/[questId]/*`, analytics routes, `src/components/QuestNavigatorDropdown.tsx`, `src/screens/LegacyTodayScreen.tsx`, `src/state/AppProvider.tsx`.

#### GET `/v1/quests/:questId`

**Purpose:** Resolve quest detail/completion deep links without depending on prior in-memory navigation.
**Authentication:** Bearer token; owner only.
**URL parameters:** `questId` — required opaque occurrence ID.
**Request body:** none.
**Database models:** `quest_definitions`, `quest_occurrences`, `quest_completions`.

**Example request:** `GET /v1/quests/quest_01J...` with bearer and request-ID headers.

**Success — `200 OK`:** one canonical `Quest`.
**Errors:** `401` standard unauthorized; `403` standard forbidden or preferably `404` to prevent enumeration; `404` `{"message":"Quest could not be found.","code":"not_found","retryable":false,"requestId":"req_123"}`; `500` standard server JSON.

**Frontend files:** declared in API files; intended consumers `app/quest/[questId]/index.tsx`, `app/quest/[questId]/complete.tsx`, `app/analytics/habit/[habitId].tsx`, plus deep-link bootstrap in `src/state/AppProvider.tsx` (not implemented).

#### POST `/v1/quests`

**Purpose:** Create a one-time task or recurring habit connected to an owned goal. For a habit, create its definition and the first scheduled occurrence.
**Authentication:** Bearer token; user only.
**Database models:** `quest_definitions`, `quest_occurrences`, goal ownership relation.

**Request body sent by the current frontend**

```json
{
  "goalId":"goal_01J...",
  "title":"Calculus focus session",
  "description":"Timed differentiation practice.",
  "kind":"habit",
  "status":"scheduled",
  "scheduledAt":"2026-07-18T19:00:00+05:30",
  "deadlineAt":"2026-07-18T20:15:00+05:30",
  "durationMinutes":45,
  "priority":"high",
  "plannedIntensity":"intense",
  "recurrence":"Mon,Wed,Fri",
  "proofPolicy":"optional",
  "rewardXp":90,
  "rewardRubies":12,
  "bossDamage":7
}
```

| Field | Type | Required | Validation/authority |
| --- | --- | --- | --- |
| `goalId` | string | yes | Must identify an active goal owned by the bearer |
| `title` | string | yes | Trim; current UI requires at least 3; maximum 160 |
| `description` | string | yes | Maximum 2,000; may be empty |
| `kind` | enum | yes | `habit | task` |
| `status` | string | sent | Frontend sends `scheduled`; server must set it, not trust arbitrary values |
| `scheduledAt` | timestamp | yes | Valid RFC 3339 timestamp with offset |
| `deadlineAt` | timestamp | optional | Must be at/after scheduled time when supplied |
| `durationMinutes` | integer | yes | Current UI minimum 5; maximum 1,440 |
| `priority` | enum | yes | `low | medium | high | critical` |
| `plannedIntensity` | enum | yes | `light | normal | intense` |
| `recurrence` | string | optional | Only for `habit`; current UI uses free text such as `Mon,Wed,Fri`; maximum 500 |
| `proofPolicy` | enum | yes | `required | optional | none`; proof is configurable per habit/quest |
| `rewardXp` | integer | currently sent | Ignore/recompute; frontend suggestions are `45/90/120` depending on priority |
| `rewardRubies` | integer | currently sent | Ignore/recompute; frontend suggestions are `6/12/16` |
| `bossDamage` | integer | currently sent | Ignore/recompute; frontend suggestions are `3/7/10` |

For `kind=task`, reject or clear `recurrence`. The server must produce deterministic reward values from its own versioned rules and return them in the created `Quest`.

**Example request:** `POST /v1/quests` with the JSON body above.

**Success — `201 Created`:** canonical `Quest` with server-generated ID and authoritative status/rewards.
**Errors:** `400/422` `{"message":"Add a title, active goal, valid time, and at least 5 minutes.","code":"validation","retryable":false,"requestId":"req_123"}`; `401` standard unauthorized; `403` goal not owned JSON; `404` `{"message":"The connected Odyssey could not be found.","code":"not_found","retryable":false,"requestId":"req_123"}`; `409` `{"message":"A matching occurrence already exists at this time.","code":"conflict","retryable":false,"requestId":"req_123"}`; `500` standard server JSON.

**Frontend files:** `app/quest/new.tsx`; `src/state/AppProvider.tsx`; API adapter/contract files; proof-required creation is exercised in `__tests__/mockApi.test.ts`.

#### PATCH `/v1/quests/:questId`

**Purpose:** Reschedule the selected quest occurrence. The current detail screen sends only `scheduledAt` and `status`.
**Authentication:** Bearer token; owner only.
**URL parameters:** `questId` — required opaque occurrence ID.
**Database models:** `quest_occurrences`.

**Request body**

```json
{"scheduledAt":"2026-07-19T19:00:00+05:30","status":"scheduled"}
```

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| `scheduledAt` | timestamp | optional | Valid RFC 3339 timestamp; current UI supplies this |
| `status` | enum | optional | Current UI sends only `scheduled` while rescheduling |

At least one field is required. Reject mutation of completed/missed occurrences and reject all server-owned fields. The TypeScript client presently permits `Partial<Quest>`, but the shipped screen does not send title, rewards, completion fields, or ownership fields.

**Example request:** `PATCH /v1/quests/quest_01J...` with the JSON body above.

**Success — `200 OK`:** full updated canonical `Quest`.
**Errors:** `400/422` invalid time/status JSON; `401` standard unauthorized; `404` quest not found JSON; `409` `{"message":"A completed or missed occurrence cannot be rescheduled.","code":"conflict","retryable":false,"requestId":"req_123"}`; `500` standard server JSON.

**Frontend files:** `app/quest/[questId]/index.tsx`; `src/state/AppProvider.tsx`; API adapter/contract files.

#### DELETE `/v1/quests/:questId`

**Purpose:** Remove the selected occurrence from the quest detail screen. The current UI does not offer a separate “delete all future habit occurrences” control, so this endpoint deletes only the identified occurrence.
**Authentication:** Bearer token; owner only.
**URL parameters:** `questId` — required opaque occurrence ID.
**Request body:** none.
**Database models:** `quest_occurrences`; preserve immutable completion/reward history if an already completed item is protected from deletion.

**Example request:** `DELETE /v1/quests/quest_01J...` with bearer and request-ID headers.

**Success — `200 OK`:** `null`.
**Errors:** `401` standard unauthorized; `404` quest not found JSON; `409` `{"message":"A confirmed completion cannot be removed from history.","code":"conflict","retryable":false,"requestId":"req_123"}`; `500` standard server JSON.

**Frontend files:** `app/quest/[questId]/index.tsx`; `src/state/AppProvider.tsx`; API adapter/contract files.

#### POST `/v1/quests/:questId/completion`

**Purpose:** Confirm one occurrence and atomically update its actual intensity, proof reference, rewards, streaks, roadmap progress, and boss health. This is the highest-integrity mutation in the current frontend.
**Authentication:** Bearer token; owner only.
**URL parameters:** `questId` — required opaque occurrence ID.
**Database models:** `quest_occurrences`, `quest_completions`, `proof_attachments`, `reward_accounts`, `reward_ledger`, `streaks`, `goals`, `roadmap_levels`, `idempotency_records`.

**Request body**

```json
{
  "actualIntensity":"intense",
  "proofUri":"user_01J.../completions/01J...-proof.jpg",
  "clientMutationId":"complete-quest_01J...-1"
}
```

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| `actualIntensity` | enum | yes | `light | normal | intense`; remains separate from planned intensity |
| `proofUri` | string | conditional | Required when `proofPolicy=required`; in live mode must be an owner-scoped private Storage object key, not a local URI or public URL |
| `clientMutationId` | string | yes | Non-empty, maximum 200; unique per user and semantic completion; idempotency key |

**Example request:** `POST /v1/quests/quest_01J.../completion` with the JSON body above.

**Atomic rules**

1. Lock/read the owned occurrence and its goal/reward account.
2. If `(user_id, clientMutationId)` already succeeded, return the original receipt without awarding twice.
3. Reject an already completed occurrence submitted under a different mutation ID with `409`.
4. Verify required proof object existence, ownership prefix, allowed content type, size, and unclaimed state.
5. Compute status, `completedAt`, actual intensity, XP, rubies, streak transitions, roadmap movement, and boss damage server-side.
6. Insert completion, proof link, reward ledger rows, and updated aggregates in one database transaction.
7. Return the committed receipt only after every write succeeds. On failure, no XP/rubies/boss/streak state may move.

**Success — `200 OK`**

```json
{
  "quest": {
    "id":"quest_01J...","goalId":"goal_01J...","title":"Calculus focus session","description":"Timed differentiation practice.",
    "kind":"habit","status":"completed","scheduledAt":"2026-07-18T19:00:00+05:30","deadlineAt":"2026-07-18T20:15:00+05:30",
    "durationMinutes":45,"priority":"high","plannedIntensity":"normal","actualIntensity":"intense","recurrence":"Mon,Wed,Fri",
    "proofPolicy":"required","proofUri":"user_01J.../completions/01J...-proof.jpg","rewardXp":90,"rewardRubies":12,"bossDamage":7,
    "completedAt":"2026-07-18T13:42:21.000Z"
  },
  "rewards":{"xp":90,"rubies":12},
  "bossHealth":55
}
```

**Errors:** `400/422` `{"message":"Choose an actual intensity before completion.","code":"validation","retryable":false,"requestId":"req_123"}`; `401` standard unauthorized; `403` invalid/foreign proof JSON; `404` quest not found JSON; `409` `{"message":"This quest occurrence is already completed.","code":"conflict","retryable":false,"requestId":"req_123"}`; `422` required proof `{"message":"This quest needs private photo proof before completion.","code":"validation","retryable":false,"requestId":"req_123"}`; `500` `{"message":"Completion was not confirmed; no progress was changed.","code":"server","retryable":true,"requestId":"req_123"}`.

**Frontend files:** `app/quest/[questId]/complete.tsx`; `app/proof/capture.tsx` (supplies local draft today); `src/state/AppProvider.tsx`; API adapter/contract files; atomic receipt/proof semantics in `__tests__/mockApi.test.ts`.

### Private proof storage

#### POST `/v1/proof/upload-target`

**Purpose:** Validate proof metadata and create a short-lived signed upload target for the private Supabase Storage bucket.
**Authentication:** Bearer token; user only.
**Database models:** optional `proof_upload_intents`; Supabase Storage object policy.

**Request body**

```json
{"fileName":"calculus-proof.jpg","contentType":"image/jpeg","byteLength":1842331}
```

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| `fileName` | string | yes | Strip path components; safe filename; 1–255 chars |
| `contentType` | enum | yes | `image/jpeg | image/png | image/heic` |
| `byteLength` | integer | optional | Positive and within configured upload limit; recommended 10 MiB maximum |

Never trust extension alone. Generate the object key server-side using `auth.uid()`; do not allow the caller to choose a bucket or owner prefix.

**Example request:** `POST /v1/proof/upload-target` with the JSON body above.

**Success — `200 OK`**

```json
{
  "uploadUrl":"https://<project>.supabase.co/storage/v1/upload/sign/...",
  "objectKey":"user_01J.../completions/01J...-calculus-proof.jpg",
  "headers":{"Content-Type":"image/jpeg"},
  "expiresAt":"2026-07-18T13:47:21.000Z"
}
```

**Errors:** `400/422` invalid metadata JSON; `401` standard unauthorized; `413` proof too large JSON; `429` rate-limit JSON; `500` `{"message":"Odyssey could not prepare the private upload.","code":"server","retryable":true,"requestId":"req_123"}`.

**Frontend files:** declared in API adapter/contract files; intended integration from `app/proof/capture.tsx` and `app/quest/[questId]/complete.tsx`; boundary tested in `__tests__/mockApi.test.ts`. Not called today.

#### POST `/v1/proof/attachments`

**Purpose:** Attach an already uploaded private object to an owned completion record and persist capture metadata.
**Authentication:** Bearer token; user only.
**Database models:** `quest_completions`, `proof_attachments`, Supabase Storage objects.

**Request body**

```json
{
  "completionId":"completion_01J...",
  "objectKey":"user_01J.../completions/01J...-calculus-proof.jpg",
  "capturedAt":"2026-07-18T13:40:00.000Z"
}
```

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| `completionId` | string | yes | Must reference the bearer's completion |
| `objectKey` | string | yes | Must exist in private bucket, use bearer prefix, and not already belong elsewhere |
| `capturedAt` | timestamp | yes | Valid timestamp; reject implausibly future timestamps |

**Example request:** `POST /v1/proof/attachments` with the JSON body above.

**Success — `201 Created`**

```json
{"id":"proof_01J...","completionId":"completion_01J...","objectKey":"user_01J.../completions/01J...-calculus-proof.jpg","capturedAt":"2026-07-18T13:40:00.000Z"}
```

**Errors:** `400/422` invalid metadata JSON; `401` standard unauthorized; `403` foreign object/completion JSON; `404` object/completion not found JSON; `409` `{"message":"This proof object is already attached.","code":"conflict","retryable":false,"requestId":"req_123"}`; `500` standard server JSON.

**Frontend files:** API adapter/contract files; intended `app/proof/capture.tsx` / completion flow; `__tests__/mockApi.test.ts`. Not called today.

> Current sequencing gap: the frontend does not receive a `completionId` in `CompletionReceipt`, and required proof must exist before completion. The contract-compatible live path is to send the uploaded `objectKey` as completion `proofUri` and create/link the attachment inside the completion transaction. Keep this standalone endpoint for post-completion optional attachments or add `completionId` to the receipt in a coordinated frontend contract revision.

#### GET `/v1/proof/:proofId/private-url`

**Purpose:** Return a short-lived signed read URL so an owner can review their own proof without making the bucket public.
**Authentication:** Bearer token; owner only.
**URL parameters:** `proofId` — required proof attachment ID.
**Request body:** none.
**Database models:** `proof_attachments`, `quest_completions`, Supabase Storage.

**Example request:** `GET /v1/proof/proof_01J.../private-url` with bearer and request-ID headers.

**Success — `200 OK`**

```json
{"proofId":"proof_01J...","url":"https://<project>.supabase.co/storage/v1/object/sign/...","expiresAt":"2026-07-18T13:47:21.000Z"}
```

Use a short expiry (the mock uses five minutes); never store or return a permanent public URL.

**Errors:** `401` standard unauthorized; `403` standard forbidden or safer `404`; `404` `{"message":"Proof could not be found.","code":"not_found","retryable":false,"requestId":"req_123"}`; `500` standard server JSON.

**Frontend files:** API adapter/contract files; intended proof-history screens (not yet implemented); boundary tested in `__tests__/mockApi.test.ts`. Not called today.

### Rewards and inventory

#### GET `/v1/rewards`

**Purpose:** Load ruby balance, earned unopened chests, boosts, streak protection, and cosmetic inventory for Profile and Rewards. XP is returned by `GET /profile`, not in this object.
**Authentication:** Bearer token; user only.
**Request body:** none.
**Database models:** `reward_accounts`, `reward_chests`, `boost_catalog`, `user_boosts`, `cosmetic_catalog`, `user_cosmetics`.

**Example request:** `GET /v1/rewards` with bearer and request-ID headers.

**Success — `200 OK`:** canonical `RewardInventory`.
**Errors:** `401` standard unauthorized; `404` `{"message":"Reward inventory could not be found.","code":"not_found","retryable":false,"requestId":"req_123"}`; `500` standard server JSON.

**Frontend files:** declared in API files; intended seeded-state consumers `app/(tabs)/profile.tsx`, `app/rewards.tsx`, `src/screens/LegacyTodayScreen.tsx`, and bootstrap in `src/state/AppProvider.tsx`. Not called on app start today.

#### POST `/v1/rewards/chests/:chestId/open`

**Purpose:** Open one already-earned unopened chest and atomically grant its server-selected contents.
**Authentication:** Bearer token; owner only.
**URL parameters:** `chestId` — required earned chest instance ID. The demo route uses `tide-chest-1`.
**Request body:** none.
**Database models:** `reward_chests`, `chest_openings`, `reward_accounts`, `reward_ledger`, `user_cosmetics`.

**Example request:** `POST /v1/rewards/chests/tide-chest-1/open` with bearer and request-ID headers and no body.

**Success — `200 OK`**

```json
{"chestId":"tide-chest-1","xp":120,"rubies":24,"cosmetic":"Sunwake Trail"}
```

`cosmetic` is optional. Grant inventory, XP, rubies, and chest-open state in one transaction; retrying the same chest must return the prior receipt or a conflict, never duplicate rewards.

**Errors:** `401` standard unauthorized; `404` `{"message":"The earned chest could not be found.","code":"not_found","retryable":false,"requestId":"req_123"}`; `409` `{"message":"No earned chest is waiting to be opened.","code":"conflict","retryable":false,"requestId":"req_123"}`; `500` `{"message":"The chest was not opened and no reward was granted.","code":"server","retryable":true,"requestId":"req_123"}`.

**Frontend files:** `app/rewards.tsx`; `app/rewards/chest/[chestId].tsx`; `src/state/AppProvider.tsx`; API adapter/contract files.

#### POST `/v1/rewards/boosts/:boostId/apply`

**Purpose:** Consume one owned boost and return the resulting inventory. The Rewards screen displays boosts, but no current button invokes this endpoint.
**Authentication:** Bearer token; owner only.
**URL parameters:** `boostId` — required boost catalog ID.
**Request body:** none.
**Database models:** `boost_catalog`, `user_boosts`, `reward_ledger`.

**Example request:** `POST /v1/rewards/boosts/boost_focus/apply` with bearer and request-ID headers and no body.

**Success — `200 OK`:** full canonical `RewardInventory` with the quantity decremented.
**Errors:** `401` standard unauthorized; `404` boost not found JSON; `409` `{"message":"That boost is not available.","code":"conflict","retryable":false,"requestId":"req_123"}`; `500` standard server JSON.

The current contract has no target/context body. Therefore implement only boosts whose effect is unambiguous from `boostId` and current account state. A boost requiring a quest/goal target needs a coordinated contract change, not an undocumented query parameter.

**Frontend files:** API adapter/contract files; `app/rewards.tsx` displays the inventory; `src/state/AppProvider.tsx` has no action for it. Not called today.

#### POST `/v1/rewards/cosmetics/:cosmeticId/select`

**Purpose:** Select one unlocked cosmetic and return authoritative inventory.
**Authentication:** Bearer token; owner only.
**URL parameters:** `cosmeticId` — required cosmetic catalog ID.
**Request body:** none.
**Database models:** `cosmetic_catalog`, `user_cosmetics`, `profiles` or selected-cosmetic relation.

**Example request:** `POST /v1/rewards/cosmetics/cos_sunwake/select` with bearer and request-ID headers and no body.

**Success — `200 OK`:** canonical `RewardInventory` with exactly one selected unlocked cosmetic.
**Errors:** `401` standard unauthorized; `404` cosmetic not found JSON; `409` `{"message":"That cosmetic is still locked.","code":"conflict","retryable":false,"requestId":"req_123"}`; `500` standard server JSON.

Also update the profile's `selectedCosmetic` projection in the same transaction so `GET /profile` and `GET /rewards` cannot disagree.

**Frontend files:** `app/rewards.tsx`; API adapter/contract files. `src/state/AppProvider.tsx` currently changes cosmetic/profile state locally and does not call this endpoint.

### Analytics read models

Analytics must be derived from persisted schedules, immutable completions, actual intensity, reward ledger entries, goal/roadmap state, and deadlines. Do not calculate trusted analytics from client-submitted aggregates.

#### GET `/v1/analytics/overall`

**Purpose:** Load the week/month account analytics page: completed quests, completion rate, consistency, XP/rubies earned, actual intensity mix, and daily trend.
**Authentication:** Bearer token; user only.
**Query parameters:** `period` — required enum `week | month`.
**Request body:** none.
**Database models:** `quest_occurrences`, `quest_completions`, `reward_ledger`, streak aggregates.

**Example request:** `GET /v1/analytics/overall?period=week`.

**Success — `200 OK`**

```json
{
  "period":"week",
  "questsCompleted":9,
  "completionRate":84,
  "consistency":78,
  "xpEarned":620,
  "rubiesEarned":86,
  "intensity":{"light":2,"normal":5,"intense":2},
  "daily":[{"label":"Mon","value":78},{"label":"Tue","value":92}]
}
```

| Field | Type | Rule |
| --- | --- | --- |
| `period` | enum | Echo validated query |
| `questsCompleted` | non-negative integer | Confirmed completions in window |
| `completionRate` | integer `0..100` | Completed required/scheduled occurrences over eligible occurrences |
| `consistency` | integer `0..100` | Version and document formula; do not substitute completion rate silently |
| `xpEarned`, `rubiesEarned` | non-negative integer | Sum immutable ledger grants in window |
| `intensity` | object | Count confirmed actual `light/normal/intense` values |
| `daily` | array | Labels and percentage/integer values for selected window |

**Errors:** `400` `{"message":"Period must be week or month.","code":"validation","retryable":false,"requestId":"req_123"}`; `401` standard unauthorized; `500` standard server JSON.

**Frontend files:** API adapter/contract files; `app/analytics.tsx` currently imports `overallAnalytics` directly from `src/data/mockData.ts` and does not call this endpoint.

#### GET `/v1/analytics/habits/:habitId`

**Purpose:** Load habit-level streak, scheduled/completed/missed counts, intensity distribution, and planned-versus-actual weekly trend. The route currently passes a quest ID as `habitId`; backend lookup must resolve that occurrence to its habit definition.
**Authentication:** Bearer token; owner only.
**URL parameters:** `habitId` — required habit definition ID or, for current compatibility, an occurrence ID belonging to that habit.
**Request body:** none.
**Database models:** `quest_definitions`, `quest_occurrences`, `quest_completions`, `habit_streaks`.

**Example request:** `GET /v1/analytics/habits/habit_01J...` with bearer and request-ID headers.

**Success — `200 OK`**

```json
{
  "habitId":"habit_01J...",
  "currentStreak":14,
  "longestStreak":21,
  "scheduled":18,
  "completed":15,
  "missed":3,
  "intensity":{"light":3,"normal":8,"intense":4},
  "weekly":[{"day":"Mon","planned":2,"actual":3},{"day":"Tue","planned":2,"actual":2}]
}
```

`planned`/`actual` are integer chart values; keep the scale consistent across all seven days and document it server-side (for example `light=1, normal=2, intense=3`, `0=no eligible/completed session`).

**Errors:** `401` standard unauthorized; `404` `{"message":"Habit analytics could not be found.","code":"not_found","retryable":false,"requestId":"req_123"}`; `422` task-not-habit `{"message":"Habit analytics requires a recurring habit.","code":"validation","retryable":false,"requestId":"req_123"}`; `500` standard server JSON.

**Frontend files:** API adapter/contract files; `app/analytics/habit/[habitId].tsx` currently imports static analytics and reads quests from provider state.

#### GET `/v1/analytics/goals/:goalId`

**Purpose:** Load roadmap completion, stage count, connected quest completion, boss health, and elapsed deadline percentage for one owned goal.
**Authentication:** Bearer token; owner only.
**URL parameters:** `goalId` — required goal ID.
**Request body:** none.
**Database models:** `goals`, `roadmap_levels`, `quest_occurrences`, `quest_completions`.

**Example request:** `GET /v1/analytics/goals/goal_01J...` with bearer and request-ID headers.

**Success — `200 OK`**

```json
{"goalId":"goal_01J...","roadmapProgress":42,"completedStages":3,"connectedQuestCompletion":78,"bossHealth":62,"deadlineProgress":54}
```

All percentage/health values are integers `0..100`. `deadlineProgress` is elapsed time, not earned progress; `connectedQuestCompletion` is based on confirmed eligible occurrences.

**Errors:** `401` standard unauthorized; `404` goal analytics not found JSON; `500` standard server JSON.

**Frontend files:** API adapter/contract files; `app/analytics/goal/[goalId].tsx` currently imports static analytics and reads the selected goal from provider state.

### Notifications and reminder preferences

#### GET `/v1/notifications`

**Purpose:** Load the user's in-app reminder/reward inbox and unread count used by headers and Today.
**Authentication:** Bearer token; user only.
**Query parameters:** none in the current adapter.
**Request body:** none.
**Database models:** `notifications`.

**Example request:** `GET /v1/notifications` with bearer and request-ID headers.

**Success — `200 OK`:** `NotificationItem[]`, newest first; empty state `[]`.
**Errors:** `401` standard unauthorized; `500` `{"message":"Odyssey could not load notifications.","code":"server","retryable":true,"requestId":"req_123"}`.

**Frontend files:** declared in API files; intended seeded-state consumers `app/notifications.tsx`, `app/(tabs)/today.tsx`, `src/components/ScreenHeader.tsx`, `src/state/AppProvider.tsx`. Not called on app start today.

#### POST `/v1/notifications/:notificationId/read`

**Purpose:** Mark one inbox item read when the user taps it. The operation should be idempotent.
**Authentication:** Bearer token; owner only.
**URL parameters:** `notificationId` — required notification ID.
**Request body:** none.
**Database models:** `notifications`.

**Example request:** `POST /v1/notifications/notification_01J.../read` with bearer and request-ID headers and no body.

**Success — `200 OK`:** updated canonical `NotificationItem` with `read: true`.
**Errors:** `401` standard unauthorized; `404` `{"message":"Notification could not be found.","code":"not_found","retryable":false,"requestId":"req_123"}`; `500` standard server JSON.

**Frontend files:** `app/notifications.tsx`; `src/state/AppProvider.tsx`; API adapter/contract files.

#### GET `/v1/notifications/preferences`

**Purpose:** Load server-side reminder-delivery preferences.
**Authentication:** Bearer token; user only.
**Request body:** none.
**Database models:** `app_preferences`.

**Example request:** `GET /v1/notifications/preferences` with bearer and request-ID headers.

**Success — `200 OK`**

```json
{"questReminders":true,"deadlineReminders":true,"overdueReminders":true,"reminderLeadMinutes":15}
```

**Errors:** `401` standard unauthorized; `500` standard server JSON.

**Frontend files:** API adapter/contract files; intended `app/settings/reminders.tsx` / `src/state/AppProvider.tsx`; boundary tested in `__tests__/mockApi.test.ts`. The current provider instead loads AsyncStorage and uses `PATCH /profile/preferences`.

#### PATCH `/v1/notifications/preferences`

**Purpose:** Persist the four reminder-delivery fields independently of display/accessibility preferences.
**Authentication:** Bearer token; user only.
**Database models:** `app_preferences`, notification scheduling jobs.

**Request body**

```json
{"questReminders":true,"deadlineReminders":false,"overdueReminders":true,"reminderLeadMinutes":30}
```

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| `questReminders` | boolean | yes | — |
| `deadlineReminders` | boolean | yes | — |
| `overdueReminders` | boolean | yes | — |
| `reminderLeadMinutes` | integer | yes | Current UI choices `5/15/30/60`; server range `1..1440` |

**Example request:** `PATCH /v1/notifications/preferences` with the complete JSON body above.

**Success — `200 OK`:** return all four stored fields.
**Errors:** `400/422` invalid preferences JSON; `401` standard unauthorized; `500` `{"message":"Odyssey could not save reminder preferences.","code":"server","retryable":true,"requestId":"req_123"}`.

**Frontend files:** API adapter/contract files; intended `app/settings/reminders.tsx` / `src/state/AppProvider.tsx`; `__tests__/mockApi.test.ts`. Not called today; the profile preferences endpoint is used instead.

# Authentication Flow

## Current implemented flow

### Register

1. `/sign-up` validates `name` (minimum 2), email, and password (minimum 8).
2. `AppProvider.signUp` calls `POST /v1/auth/sign-up` through the selected adapter.
3. The response must contain `{ accessToken, user }`.
4. The provider stores only `user`, sets an in-memory `signedIn=true`, discards `accessToken`, and navigates to `/goal/new`.

### Login

1. `/sign-in` validates email and a minimum 6-character password.
2. `AppProvider.signIn` calls `POST /v1/auth/sign-in`.
3. The provider stores only the returned profile, sets an in-memory boolean, and navigates to Today.

### Logout

1. Settings calls `POST /v1/auth/sign-out`.
2. The current provider ignores the endpoint result, sets `signedIn=false`, and navigates to Welcome.
3. It does not clear a persisted token because no token is persisted today.

### Protected routes

There are no protected-route guards. `/welcome` has an “Explore the demo” action that enters Today without authentication; direct deep links also render against seeded state. Backend endpoints must still enforce JWT ownership regardless of client navigation.

## Required live-integration flow using the current endpoint set

1. Sign-in/sign-up returns the Supabase access token and `UserProfile` exactly as declared.
2. The frontend must retain the token in secure native storage (not plain AsyncStorage), attach `Authorization: Bearer <JWT>` to every protected request, and clear it on confirmed/local logout.
3. On app launch, restore/validate the session before rendering a protected route, then fetch profile, goals, quests, rewards, notifications, and preferences.
4. On `401`, clear invalid session state and navigate to sign-in. The current adapter must be extended to do this coherently.
5. Supabase RLS and/or backend authorization must use the JWT subject (`auth.uid()`), never a user ID supplied by the client.

## Refresh token flow

**Not present in the frontend contract.** `Session` contains only `accessToken`; there is no refresh token field, refresh endpoint, Supabase client session listener, or secure session store. Do not silently add `POST /v1/auth/refresh` to the implementation checklist and claim compatibility. Choose one coordinated integration before production:

- use the Supabase client session lifecycle in Expo and send its current access JWT to this API; or
- expand `Session` with refresh-token/expiry fields and add a backend refresh endpoint.

Until one is implemented, live sessions will fail after access-token expiry.

## Password reset flow

**Not present.** There is no forgot-password screen, reset-link handling route, request contract, or update-password form. No password-reset endpoint is required by the current frontend. Adding it requires a product/frontend contract change.

## Authentication security rules

- Rate-limit sign-in/sign-up by IP and normalized email without leaking account existence.
- Never log passwords, JWTs, refresh tokens, Groq keys, signed proof URLs, or proof object contents.
- Validate JWT signature, issuer, audience, and expiry using Supabase's official verification mechanism.
- Keep service-role credentials server-side only.
- Return `404` rather than ownership-revealing `403` for user-owned IDs where practical.
- The demo route may remain a local presentation feature, but it must never receive access to real user data.

# Complete Database Schema

The frontend uses camelCase JSON; the schema below uses PostgreSQL snake_case. The API layer maps between them. Use UUIDs or ULIDs consistently, `timestamptz` for instants, and `date` for date-only goal deadlines.

## Entity relationships

```text
auth.users
  └─1 profiles
      ├─1 app_preferences
      ├─* goals ──* roadmap_levels ──* roadmap_level_suggestions
      ├─* quest_definitions ──* quest_occurrences ──0..1 quest_completions ──* proof_attachments
      ├─1 reward_accounts ──* reward_ledger
      ├─* reward_chests ──0..1 chest_openings
      ├─* user_boosts ──1 boost_catalog
      ├─* user_cosmetics ──1 cosmetic_catalog
      ├─* habit_streaks
      ├─1 overall_streaks
      ├─* notifications
      └─* idempotency_records
```

## `profiles`

| Column | Type | Constraints/purpose |
| --- | --- | --- |
| `id` | uuid | PK; FK `auth.users.id` cascade delete |
| `name` | text | not null, 2–80 |
| `handle` | citext/text | not null, unique if globally addressable; frontend display field |
| `account_level` | integer | not null default 1, `>=1`; server-derived |
| `xp` | bigint | not null default 0, `>=0`; permanent earned XP |
| `xp_to_next_level` | bigint | not null; server-derived threshold projection |
| `overall_streak` | integer | not null default 0; denormalized projection |
| `avatar_seed` | text | not null; generated/safe display seed |
| `selected_cosmetic_id` | text/uuid | nullable FK cosmetic catalog/user unlock |
| `created_at` | timestamptz | not null default now() |
| `updated_at` | timestamptz | not null default now() |

## `app_preferences`

| Column | Type | Constraints/purpose |
| --- | --- | --- |
| `user_id` | uuid | PK/FK profiles |
| `reduced_motion_override` | text | check `system/on/off` |
| `haptics` | boolean | not null default true |
| `high_contrast` | boolean | not null default false |
| `graphics_quality` | text | check `auto/full/balanced/calm` |
| `quest_reminders` | boolean | not null default true |
| `deadline_reminders` | boolean | not null default true |
| `overdue_reminders` | boolean | not null default true |
| `reminder_lead_minutes` | integer | check `1..1440` |
| `updated_at` | timestamptz | not null default now() |

The profile-preferences and notification-preferences endpoints update projections of this same row, preventing two preference sources from drifting.

## `goals`

| Column | Type | Constraints/purpose |
| --- | --- | --- |
| `id` | uuid | PK |
| `user_id` | uuid | not null FK profiles; indexed |
| `title` | text | not null, 1–160 |
| `short_title` | text | not null, 1–60 |
| `description` | text | not null default `''`, max 2,000 |
| `deadline` | date | not null |
| `current_level` | integer | not null default 1, check `1..10`; server-derived |
| `progress` | integer | not null default 0, check `0..100`; server-derived |
| `accent` | text | not null; validated hex/theme token |
| `status` | text | check `active/completed/draft` |
| `boss_name` | text | not null |
| `boss_health` | integer | not null default 100, check `0..100`; server-derived |
| `starting_point` | text | optional source context |
| `available_days` | text[] | not null; accepted plan context |
| `minutes_per_day` | integer | not null check `10..1440` |
| `preferred_intensity` | text | check `light/normal/intense` |
| `constraints` | text | not null default `''` |
| `created_at`, `updated_at` | timestamptz | audit timestamps |

## `roadmap_levels`

| Column | Type | Constraints/purpose |
| --- | --- | --- |
| `id` | uuid | PK |
| `goal_id` | uuid | not null FK goals cascade delete |
| `number` | integer | check `1..10`; unique with goal |
| `title` | text | not null, 1–160 |
| `purpose` | text | not null, max 2,000 |
| `status` | text | check `locked/active/completed` |
| `milestone` | text | not null, max 1,000 |
| `boss_type` | text | check `none/mini/final` |
| `boss_name` | text | nullable |
| `boss_health` | integer | nullable/check `0..100` |
| `created_at`, `updated_at` | timestamptz | audit timestamps |

## `roadmap_level_suggestions`

| Column | Type | Constraints/purpose |
| --- | --- | --- |
| `id` | uuid | PK |
| `level_id` | uuid | not null FK roadmap_levels cascade delete |
| `kind` | text | check `habit/task` |
| `text` | text | not null, 1–500 |
| `sort_order` | integer | not null, `>=0` |

These are suggestions displayed in the roadmap, not automatically scheduled quest records.

## `quest_definitions`

One definition represents the reusable habit/task concept; occurrences preserve each scheduled instance independently.

| Column | Type | Constraints/purpose |
| --- | --- | --- |
| `id` | uuid | PK |
| `user_id` | uuid | not null FK profiles; indexed |
| `goal_id` | uuid | not null FK goals; owner must match |
| `roadmap_level_id` | uuid | nullable FK roadmap_levels |
| `title` | text | not null, 3–160 |
| `description` | text | not null default `''`, max 2,000 |
| `kind` | text | check `habit/task` |
| `duration_minutes` | integer | check `5..1440` |
| `priority` | text | check `low/medium/high/critical` |
| `planned_intensity` | text | check `light/normal/intense` |
| `recurrence_rule` | text | nullable; only habit; current free-text contract |
| `proof_policy` | text | check `required/optional/none` |
| `reward_xp` | integer | server-derived, non-negative |
| `reward_rubies` | integer | server-derived, non-negative |
| `boss_damage` | integer | server-derived, non-negative |
| `active` | boolean | not null default true |
| `created_at`, `updated_at` | timestamptz | audit timestamps |

## `quest_occurrences`

| Column | Type | Constraints/purpose |
| --- | --- | --- |
| `id` | uuid | PK; this is the frontend `Quest.id` |
| `definition_id` | uuid | not null FK quest_definitions |
| `user_id` | uuid | not null FK profiles; indexed for RLS/query |
| `scheduled_at` | timestamptz | not null; indexed |
| `deadline_at` | timestamptz | nullable |
| `status` | text | check persisted `scheduled/inProgress/completed/upcoming/overdue/missed`; never persist `completionPending` |
| `created_at`, `updated_at` | timestamptz | audit timestamps |
| unique | `(definition_id, scheduled_at)` | prevents duplicate recurrence materialization |

The API flattens definition + occurrence fields into one `Quest` JSON object.

## `quest_completions`

| Column | Type | Constraints/purpose |
| --- | --- | --- |
| `id` | uuid | PK |
| `occurrence_id` | uuid | unique, not null FK quest_occurrences |
| `user_id` | uuid | not null FK profiles |
| `actual_intensity` | text | check `light/normal/intense` |
| `completed_at` | timestamptz | not null |
| `client_mutation_id` | text | not null; unique with user |
| `awarded_xp` | integer | immutable server-calculated grant |
| `awarded_rubies` | integer | immutable server-calculated grant |
| `boss_damage_applied` | integer | immutable server-calculated damage |
| `created_at` | timestamptz | not null default now() |

## `proof_attachments`

| Column | Type | Constraints/purpose |
| --- | --- | --- |
| `id` | uuid | PK |
| `completion_id` | uuid | not null FK quest_completions cascade delete |
| `user_id` | uuid | not null FK profiles; must match completion owner |
| `object_key` | text | not null unique; private bucket path with user prefix |
| `content_type` | text | allowed image MIME |
| `byte_length` | bigint | nullable/non-negative |
| `captured_at` | timestamptz | not null |
| `created_at` | timestamptz | not null default now() |

Do not persist signed URLs; create them on demand.

## `reward_accounts`

| Column | Type | Constraints/purpose |
| --- | --- | --- |
| `user_id` | uuid | PK/FK profiles |
| `rubies` | bigint | not null default 0, `>=0` |
| `streak_protection` | integer | not null default 0, `>=0` |
| `updated_at` | timestamptz | not null default now() |

## `reward_ledger`

| Column | Type | Constraints/purpose |
| --- | --- | --- |
| `id` | uuid | PK |
| `user_id` | uuid | not null FK profiles; indexed |
| `source_type` | text | e.g. `quest_completion/chest/boost` |
| `source_id` | uuid/text | not null; unique with source type and currency event |
| `xp_delta` | integer | not null default 0 |
| `ruby_delta` | integer | not null default 0 |
| `metadata` | jsonb | non-secret rule/version context |
| `created_at` | timestamptz | not null default now() |

This immutable ledger is the source for analytics and duplicate-grant prevention.

## `reward_chests` and `chest_openings`

`reward_chests`: `id` PK, `user_id` FK, `chest_type`, `earned_from_type`, `earned_from_id`, `earned_at`, `opened_at` nullable.
`chest_openings`: `id` PK, `chest_id` unique FK, `user_id` FK, `xp`, `rubies`, `cosmetic_id` nullable, `opened_at`.

## Boosts

`boost_catalog`: `id` PK, `name`, `description`, `effect_type`, `effect_config jsonb`, `active`.
`user_boosts`: composite PK `(user_id, boost_id)`, FKs, `quantity >= 0`, `updated_at`.

Only define effect types that can be applied without target/context under the current endpoint contract.

## Cosmetics

`cosmetic_catalog`: `id` PK, `name`, `description`, `active`.
`user_cosmetics`: composite PK `(user_id, cosmetic_id)`, FKs, `unlocked_at`, `selected boolean`, with a partial unique index allowing one selected cosmetic per user.

## Streaks

`habit_streaks`: composite PK `(user_id, definition_id)`, `current_streak`, `longest_streak`, `last_eligible_date`, `updated_at`.
`overall_streaks`: `user_id` PK, `current_streak`, `longest_streak`, `last_eligible_date`, `updated_at`.

Streak transitions must be based on independently persisted occurrences in the user's timezone. A miss can break the relevant streak but cannot subtract XP or heal boss damage.

## `notifications`

| Column | Type | Constraints/purpose |
| --- | --- | --- |
| `id` | uuid | PK |
| `user_id` | uuid | not null FK profiles; indexed |
| `quest_occurrence_id` | uuid | nullable FK occurrence |
| `title` | text | not null |
| `body` | text | not null |
| `kind` | text | check `scheduled/deadline/overdue/reward` |
| `read_at` | timestamptz | nullable; API maps to boolean `read` |
| `created_at` | timestamptz | not null; newest-first index |

## `idempotency_records`

| Column | Type | Constraints/purpose |
| --- | --- | --- |
| `user_id` | uuid | not null FK profiles |
| `operation` | text | e.g. `quest_completion`, `roadmap_accept`, `chest_open` |
| `key` | text | client mutation/request ID |
| `request_hash` | text | prevents same key with different body |
| `status_code` | integer | committed response status |
| `response_json` | jsonb | committed response for safe retry |
| `created_at`, `expires_at` | timestamptz | retention window |
| primary key | `(user_id, operation, key)` | idempotency scope |

## Required row-level security

- Enable RLS on every user-owned table.
- `SELECT/INSERT/UPDATE/DELETE` policies require `user_id = auth.uid()` or ownership reached through a parent row.
- Catalog tables permit authenticated read only; mutations are service/admin only.
- Supabase Storage bucket is private. Object policies require the first folder/key segment to equal `auth.uid()`.
- Groq calls, reward calculations, recurrence jobs, and signed URL creation run only in trusted server functions.
- Use service-role credentials only inside backend functions; never return them to Expo.

# API Execution Flow

## Register

1. `POST /v1/auth/sign-up` creates Supabase auth identity.
2. In one server-side provisioning operation, create profile, default preferences, reward account, and overall streak row.
3. Return raw `Session`.
4. Frontend stores session securely (missing today), then navigates to goal creation.
5. Goal form submits `POST /v1/roadmaps/generate`; this creates no product rows.
6. User edits locally and explicitly submits `POST /v1/roadmaps/accept`, which creates goal + levels atomically.

## Login

1. `POST /v1/auth/sign-in` returns access token + profile.
2. Store token securely and attach it to protected requests (missing today).
3. Bootstrap dashboard data with parallel `GET /profile`, `/goals`, `/quests`, `/rewards`, `/notifications`, plus one canonical preferences source.
4. Do not render seeded data as if it belonged to the authenticated user.

## Open dashboard

Use existing endpoints; no invented dashboard aggregate is necessary:

```text
GET /v1/profile
GET /v1/goals
GET /v1/quests
GET /v1/rewards
GET /v1/notifications
GET /v1/notifications/preferences (or profile preferences projection)
```

Today derives its featured/ordered quest, active goal/boss, unread count, streak, and display preferences from those responses. Deep links separately call `GET /goals/:goalId` or `GET /quests/:questId` when the item is absent from the bootstrap cache.

## Create data

### Goal/roadmap

`POST /roadmaps/generate` → local review/edit/reorder → `POST /roadmaps/accept` → cache returned Goal.

### Quest

`POST /quests` → server validates owned goal and computes rewards → cache returned Quest. For habits, backend materializes independent occurrences according to recurrence rules.

### Completion with proof

1. `POST /proof/upload-target` with metadata.
2. Upload bytes directly to returned signed URL with returned headers.
3. `POST /quests/:questId/completion` using the returned private object key in `proofUri` and a stable `clientMutationId`.
4. Backend atomically records completion/proof/reward/streak/boss changes.
5. Frontend applies only the confirmed receipt.
6. `POST /proof/attachments` is used only for a later optional attachment unless the completion receipt contract is extended with `completionId`.

## Update data

- Goal edit: `PATCH /goals/:goalId`; replace cached Goal with response.
- Quest reschedule: `PATCH /quests/:questId`; replace cached occurrence.
- Preferences: merge locally, send full `PATCH /profile/preferences`, reconcile with response. Choose one canonical reminder-preference endpoint before wiring live state.
- Notification: `POST /notifications/:id/read`; replace inbox item.
- Cosmetic: `POST /rewards/cosmetics/:id/select`; replace inventory and refresh/update profile projection.
- Boost: `POST /rewards/boosts/:id/apply`; replace inventory.

## Delete data

`DELETE /quests/:questId` → on `200 null`, remove only that occurrence from cache. No current frontend endpoint deletes goals, profiles, proof, notifications, or completion history.

## Logout

1. `POST /auth/sign-out` with bearer token.
2. Clear secure token/session and all user-owned cached state even if the remote session is already expired.
3. Cancel/invalidate in-flight queries and mutations so late responses cannot repopulate another session.
4. Navigate to Welcome.

# Missing Backend Features

This section distinguishes **frontend wiring gaps** from **features with no backend contract**. The 31-endpoint checklist remains the exact current API surface.

## Blocking live integration in the current frontend

1. **Token is discarded.** `AppProvider.signIn/signUp` uses `user` but never stores `accessToken`; `liveApi` never sends `Authorization`.
2. **No session restoration or expiry handling.** `signedIn` is in-memory only; there is no secure storage, refresh lifecycle, auth listener, or boot/loading guard.
3. **No protected navigation.** All routes and the demo entry can render without a session.
4. **No server bootstrap.** Provider state always starts from `initialProfile`, `initialGoals`, `initialQuests`, `initialRewards`, and `initialNotifications`, even when `EXPO_PUBLIC_API_BASE_URL` selects the live adapter.
5. **React Query is mounted but unused.** There are no `useQuery`/`useMutation` calls, cache keys, invalidation rules, or per-resource loading/error states.
6. **Analytics remains mocked.** All three analytics screens import static exports directly.
7. **Proof upload is not wired.** Image Picker creates a device-local URI; upload-target, attach, and signed-read endpoints are unused. A backend cannot read `file://...` from the device.
8. **Proof contract has a sequencing mismatch.** Attachment requires `completionId`, but completion requires proof and its receipt does not expose completion ID. This guide defines an object-key compatibility path; a cleaner contract change remains desirable.
9. **Cosmetic selection bypasses the API.** It mutates local inventory/profile only.
10. **Boost application has no UI/provider action.** The endpoint exists but cannot be triggered.
11. **Reminder settings have two competing routes.** Current UI calls profile preferences PATCH; dedicated notification preference GET/PATCH remain unused.
12. **Error mapping is lossy.** The live adapter maps only 401/404 correctly and attempts JSON parsing on every response, including what might otherwise be 204.
13. **Sign-out failure is ignored.** Local state signs out regardless, with no session-token cleanup or cache clearing.
14. **Completion rollback is semantically lossy.** On failure, the provider resets any quest to `scheduled`, even if its prior status was `overdue`, `upcoming`, or `inProgress`.

## Product/UI capabilities with no current endpoint contract

- Password reset, email verification pending UI, refresh-token API, and session inspection.
- Profile identity editing or account deletion.
- Goal archive/delete. `FRONTEND-SCOPE.md` mentions archive at the family level, but no method/path or screen action exists.
- Partial roadmap regeneration, draft persistence, and server-side draft editing. The current flow regenerates the full proposal and keeps edits in memory until acceptance.
- A structured recurrence rule/editor, timezone profile, and recurrence-series mutation semantics (“this occurrence” versus “all future”). Current recurrence is a free-text string.
- Push-device token registration/removal and backend delivery acknowledgements. The current reminder screen only manages OS permission and preference flags.
- Proof history/list endpoint. The habit analytics scope mentions proof history, but the API can only read a signed URL when a proof ID is already known.
- Pagination/date filtering/search for quests, goals, and notifications. Current list adapters accept no query parameters and will become unbounded.
- Mark-all-notifications-read, notification deletion, and read pagination.
- Dedicated missed/overdue transition job contract. The backend still needs an internal scheduler to derive those states, but the frontend exposes no administrative endpoint for it.

These are not included in the required checklist because adding them without matching frontend contracts would violate the current source of truth.

# Suggested REST API Structure

This tree is exactly the declared current frontend surface:

```text
/v1/auth
    POST /sign-in
    POST /sign-up
    POST /sign-out

/v1/profile
    GET   /
    PATCH /preferences

/v1/goals
    GET   /
    POST  /
    GET   /:goalId
    PATCH /:goalId

/v1/roadmaps
    POST /generate
    POST /accept

/v1/quests
    GET    /
    POST   /
    GET    /:questId
    PATCH  /:questId
    DELETE /:questId
    POST   /:questId/completion

/v1/proof
    POST /upload-target
    POST /attachments
    GET  /:proofId/private-url

/v1/rewards
    GET  /
    POST /chests/:chestId/open
    POST /boosts/:boostId/apply
    POST /cosmetics/:cosmeticId/select

/v1/analytics
    GET /overall?period=week|month
    GET /habits/:habitId
    GET /goals/:goalId

/v1/notifications
    GET   /
    POST  /:notificationId/read
    GET   /preferences
    PATCH /preferences
```

Do not add `/refresh`, `/password-reset`, `/devices`, `/goals/:id/archive`, or proof-list endpoints and describe them as frontend-compatible until their client contracts and screens exist.

# Environment Variables Needed

## Expo client

```dotenv
EXPO_PUBLIC_API_BASE_URL=https://api.example.com
```

This is public configuration. Never put service-role, Groq, JWT signing, or database secrets in any `EXPO_PUBLIC_*` value.

## Backend runtime

```dotenv
NODE_ENV=production
PORT=3000
API_BASE_PATH=/v1

SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<server-only>
SUPABASE_JWKS_URL=https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json
DATABASE_URL=postgresql://<server-only-connection>

SUPABASE_PROOF_BUCKET=odyssey-private-proof
PROOF_UPLOAD_MAX_BYTES=10485760
PROOF_UPLOAD_URL_TTL_SECONDS=300
PROOF_READ_URL_TTL_SECONDS=300

GROQ_API_KEY=<server-only>
GROQ_MODEL=<approved-model-id>
GROQ_TIMEOUT_MS=30000
GROQ_MAX_RETRIES=2

ALLOWED_ORIGINS=https://<web-app-domain>
RATE_LIMIT_AUTH_PER_MINUTE=10
RATE_LIMIT_ROADMAP_PER_HOUR=20
LOG_LEVEL=info
```

Notes:

- Use Supabase JWKS verification where supported rather than distributing a legacy JWT secret.
- `DATABASE_URL` is required only if the backend connects directly to Postgres; omit it if every database operation uses a server-side Supabase client.
- `ALLOWED_ORIGINS` protects web requests; native mobile clients do not rely on browser CORS as an authorization boundary.
- No Stripe variables are needed: the product explicitly has no real-money store.
- No SMTP variables are required by the current frontend because password reset/email flows are absent.
- No push-provider credentials are listed because device registration/delivery endpoints are absent from the current contract.

# Final Checklist

## Authentication

- [ ] `POST /v1/auth/sign-in`
- [ ] `POST /v1/auth/sign-up`
- [ ] `POST /v1/auth/sign-out`

## Profile

- [ ] `GET /v1/profile`
- [ ] `PATCH /v1/profile/preferences`

## Goals and roadmap

- [ ] `GET /v1/goals`
- [ ] `POST /v1/goals`
- [ ] `GET /v1/goals/:goalId`
- [ ] `PATCH /v1/goals/:goalId`
- [ ] `POST /v1/roadmaps/generate`
- [ ] `POST /v1/roadmaps/accept`

## Quests and proof

- [ ] `GET /v1/quests`
- [ ] `POST /v1/quests`
- [ ] `GET /v1/quests/:questId`
- [ ] `PATCH /v1/quests/:questId`
- [ ] `DELETE /v1/quests/:questId`
- [ ] `POST /v1/quests/:questId/completion`
- [ ] `POST /v1/proof/upload-target`
- [ ] `POST /v1/proof/attachments`
- [ ] `GET /v1/proof/:proofId/private-url`

## Rewards

- [ ] `GET /v1/rewards`
- [ ] `POST /v1/rewards/chests/:chestId/open`
- [ ] `POST /v1/rewards/boosts/:boostId/apply`
- [ ] `POST /v1/rewards/cosmetics/:cosmeticId/select`

## Analytics

- [ ] `GET /v1/analytics/overall?period=week|month`
- [ ] `GET /v1/analytics/habits/:habitId`
- [ ] `GET /v1/analytics/goals/:goalId`

## Notifications

- [ ] `GET /v1/notifications`
- [ ] `POST /v1/notifications/:notificationId/read`
- [ ] `GET /v1/notifications/preferences`
- [ ] `PATCH /v1/notifications/preferences`

## Backend integrity and security gates

- [ ] Return raw success payloads and JSON `null` for no-resource success; never `204` with the current adapter.
- [ ] Validate Supabase JWTs on all 29 protected method/path contracts.
- [ ] Enforce owner isolation in API queries, PostgreSQL RLS, and Storage policies.
- [ ] Keep Groq and Supabase service-role credentials server-side.
- [ ] Make roadmap acceptance, completion, and chest opening idempotent.
- [ ] Make completion/rewards/streak/boss changes one transaction with an immutable reward ledger.
- [ ] Ignore/recompute client-sent XP, ruby, boss-damage, progress, status, and ownership fields.
- [ ] Keep generated roadmaps non-persistent until explicit acceptance.
- [ ] Keep proof bucket private and signed URLs short-lived.
- [ ] Persist planned and actual intensity separately.
- [ ] Persist each recurring habit occurrence independently.
- [ ] Preserve earned XP, completed roadmap stages, and defeated boss health after misses.
- [ ] Echo request IDs in errors/logs without logging credentials or proof URLs.
- [ ] Add contract/integration tests for every endpoint and cross-user isolation tests for every owned resource.

# Inspection Coverage Appendix

## Files that define or mutate backend-shaped state

- `src/api/contracts.ts`
- `src/api/endpoints.ts`
- `src/api/index.ts`
- `src/api/liveApi.ts`
- `src/api/mockApi.ts`
- `src/state/AppProvider.tsx`
- `src/types/domain.ts`
- `src/data/mockData.ts`
- `__tests__/mockApi.test.ts`

## Routes inspected

- Entry/auth: `app/index.tsx`, `welcome.tsx`, `sign-in.tsx`, `sign-up.tsx`, `_layout.tsx`
- Tabs: `app/(tabs)/_layout.tsx`, `today.tsx`, `journey.tsx`, `calendar.tsx`, `profile.tsx`
- Goals/roadmaps: `app/goal/new.tsx`, `app/goal/[goalId]/index.tsx`, `edit.tsx`, `app/roadmap/generating.tsx`, `review.tsx`, `level/[levelId].tsx`
- Quests/proof: `app/quest/new.tsx`, `app/quest/[questId]/index.tsx`, `complete.tsx`, `app/proof/capture.tsx`
- Rewards/analytics: `app/rewards.tsx`, `app/rewards/chest/[chestId].tsx`, `app/analytics.tsx`, `app/analytics/habit/[habitId].tsx`, `app/analytics/goal/[goalId].tsx`
- Notifications/settings: `app/notifications.tsx`, `app/settings.tsx`, `app/settings/accessibility.tsx`, `reminders.tsx`, `privacy.tsx`

## Presentation-only source inspected

The following files do not create additional backend requirements; they consume props, presentation preferences, navigation, animation/device capability, or already-loaded provider state:

- Components: `Button`, `Chip`, `ChoiceGroup`, `EmptyState`, `Field`, `LivingScreen`, `LoadingTide`, `ProgressBar`, `QuestCard`, `QuestNavigatorDropdown`, `QuestRoadmapCard`, `ScreenHeader`, `SectionHeader`, `StatCard`, `Surface`, `SwitchRow`, `TideBars`, `Typography`
- Hook: `src/hooks/useReducedMotion.ts`
- Legacy surface: `src/screens/LegacyTodayScreen.tsx`
- Theme/formatting: `src/theme/tokens.ts`, `src/utils/format.ts`
- World/rendering: every file under `src/world/`

## Source-of-truth documents inspected

- `README.md`
- `docs/PRODUCT.md`
- `docs/FRONTEND-SCOPE.md`
- `docs/FRONTEND-IMPLEMENTATION.md`

When a document and live code differ, this guide identifies the mismatch rather than presenting the document's aspirational feature as an already implemented endpoint.
