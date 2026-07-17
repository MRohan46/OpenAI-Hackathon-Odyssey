# Odyssey Frontend Implementation

This repository now contains a complete Expo SDK 57 presentation frontend for
the product surfaces in [PRODUCT.md](PRODUCT.md). The implementation follows the
Living Shore direction in [DESIGN.md](DESIGN.md) and keeps backend ownership
outside this repository.

## Run it

```bash
npm ci
npm run dev
```

The web presentation opens at `http://localhost:8081` by default. Native Expo
commands are also available:

```bash
npm run android
npm run ios
```

## Verification commands

```bash
npm run lint
npm run typecheck
npm test
npm run export:web
npx expo install --check
npx expo-doctor
```

## Backend handoff

No backend, provider secret, service key, or real user data is included. With no
environment configuration, the app uses the realistic in-memory adapter in
`src/api/mockApi.ts`.

Set this public configuration value to switch the entire UI to the HTTP adapter:

```bash
EXPO_PUBLIC_API_BASE_URL=https://api.example.invalid
```

The replaceable API surface is defined in:

- `src/api/contracts.ts` — typed request, response, receipt, proof, reminder,
  reward, and failure contracts.
- `src/api/endpoints.ts` — open `/v1` route paths for backend teammates.
- `src/api/liveApi.ts` — transport adapter with request IDs and explicit offline,
  authorization, missing-resource, and server failures.
- `src/api/mockApi.ts` — presentation adapter used by design QA and tests.

Endpoint families cover authentication presentation, profile preferences,
goals, AI roadmap proposal and acceptance, quests and confirmed completion,
private proof upload/attachment/read boundaries, rewards and inventory actions,
analytics, notifications, and reminder preferences.

The backend adapter must preserve these product rules:

- A generated roadmap remains a proposal until the user explicitly accepts it.
- Completion UI moves XP, rubies, boss health, and status only from a confirmed
  completion receipt.
- Planned intensity and recorded intensity remain separate fields.
- Late success and late failure responses must not mutate a screen that has
  already moved to a different request.
- Proof objects remain private and use short-lived upload/read URLs.
- Groq and Supabase service credentials remain server-side.

## Living Shore rendering

The experience has three coordinated layers:

1. A generated, production-sized shore poster that keeps every route beautiful
   before graphics initialization and on low-power devices.
2. Reanimated tide drift and route transitions controlled by user motion
   preferences.
3. A transparent React Three Fiber scene with sea-glass motes, a floating route
   marker, and a living footprint current on capable web and native clients.

WebGL is capability-tested before the canvas mounts. Unsupported or constrained
browsers retain the complete poster experience instead of showing a blank or
crashed surface. Reduced-motion and Calm graphics modes keep all navigation and
actions available while removing expensive movement.

## Route coverage

Thirty Expo Router screen and layout files cover welcome and account presentation, goal
creation, protected AI generation, editable roadmap review, all four root tabs,
quest creation/detail/completion/proof, reminders, rewards, analytics, and trust
settings. The exact route-to-product matrix is maintained in
[FRONTEND-SCOPE.md](FRONTEND-SCOPE.md).

## Design evidence

The selected keyframe is
`docs/assets/ui/living-shore-today-3d-direction.png`. Browser captures and the
side-by-side comparison live under `qa/`; the QA record and resolved findings
live in the repository-root `design-qa.md`.
