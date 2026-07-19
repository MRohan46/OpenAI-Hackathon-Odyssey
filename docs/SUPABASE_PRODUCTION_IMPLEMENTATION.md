# Odyssey production data implementation

Odyssey's Expo app now treats Supabase as the production source of truth whenever `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are configured. The former in-memory mock adapter remains only for an intentionally unconfigured presentation build; it is no longer the default for a configured app.

## What is persisted

- Private account profile, account XP/level, selected cosmetic, and preferences
- Goals, accepted ten-level roadmaps, boss health, and completed-victory records
- Scheduled habits/tasks, recurrence metadata, completion intensity, missed/overdue state, and series IDs
- Private completion proofs in the `odyssey-private-proof` Supabase Storage bucket
- Reward inventory, reward ledger, chest openings, boosts, cosmetic unlocks, and streak-protection consumption
- In-app notifications and their read state
- Real analytics calculated from the signed-in user's stored quests

The database—not the mobile client—calculates completion rewards and boss damage. Client-supplied reward values are ignored by the quest creation RPC.

## Security model

Every user-owned table uses Row Level Security. Select policies scope records to `auth.uid()` and direct client writes are purposely restricted. Security-definer RPCs validate the current authenticated user before performing protected mutations such as accepting a roadmap, creating/editing a quest, completing a quest, opening a chest, and spending rewards.

Proof images are stored in a private bucket under this exact path shape:

```text
<authenticated-user-id>/proofs/<random-id>.<extension>
```

The storage policies prevent another authenticated user from listing, reading, uploading, replacing, or deleting a different user's proof. The app creates a short-lived signed URL only when reading a private proof.

## Required one-time Supabase setup

1. Install the Supabase CLI and authenticate it with the intended project.
2. Link this repository to that project: `supabase link --project-ref <project-ref>`.
3. Apply the schema/RLS migration: `supabase db push`.
4. Set Edge Function secrets. Do **not** put the Groq secret in Expo client variables:

   ```powershell
   supabase secrets set GROQ_API_KEY="your-groq-secret" GROQ_MODEL="your-groq-model"
   ```

5. Deploy the JWT-protected roadmap function:

   ```powershell
   supabase functions deploy generate-roadmap
   ```

6. Restart Expo after confirming the app has only these public Supabase variables:

   ```dotenv
   EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

`EXPO_PUBLIC_GROQ_API_KEY` is unsafe and must be removed from the Expo `.env`. Any `EXPO_PUBLIC_*` variable is embedded in the client bundle. The Edge Function reads `GROQ_API_KEY` and `GROQ_MODEL` from its private secret environment instead.

If the Dashboard function was deployed under a different name, configure that non-secret public name in Expo instead of renaming code silently:

```dotenv
EXPO_PUBLIC_ROADMAP_FUNCTION_NAME=clever-service
```

The roadmap screen waits up to two minutes; the Edge Function gives Groq up to 110 seconds so it can return a useful `504` error before the client deadline.

## How the app behaves

- On a real Supabase session, `AppProvider` hydrates profile, preferences, goals, quests, reward inventory/history, and notifications from Supabase before the authenticated experience becomes ready.
- Roadmap generation invokes `generate-roadmap`; the function validates the user JWT, calls Groq server-side, normalizes the response to exactly ten editable levels, and never persists it. Only explicit acceptance calls the database RPC.
- Proof completion uploads an image directly to the private bucket first. The transactional completion RPC verifies the uploaded object belongs to the caller, then stores the proof reference, completion, rewards, ledger entry, notification, and boss-health change together.
- The existing UI can continue to use its typed `odysseyApi` contract; no route needs a mock-specific branch.

## Honest remaining operational work

The migration persists recurrence rules but does not yet run a scheduled materializer for future occurrences. Configure a Supabase Cron/Edge Function before relying on automatic future-occurrence generation at scale. Device notification delivery likewise still needs the Expo push-token registration and scheduled-notification worker; in-app notification records are already persistent.

Run the focused checks after applying the migration:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test -- --runInBand
```

Then manually verify two different accounts cannot read each other's rows or proof URLs, test an accepted roadmap and quest completion, and confirm a required proof cannot be completed without a successfully uploaded private object.
