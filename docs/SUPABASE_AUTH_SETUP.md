# Supabase authentication setup

Odyssey now uses Supabase Auth for email/password and Google sign-in. The app persists native sessions in Expo SecureStore, restores the session before protected routes render, refreshes sessions while the app is active, and clears local auth state on sign-out.

## 1. Configure Expo environment variables

Rename the current `.env` variables to the Expo-safe names below. Expo only includes variables prefixed with `EXPO_PUBLIC_` in the client bundle.

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

The publishable key (or legacy `anon` key) is safe to include in the app; never put a `service_role` key in `.env` for the mobile application.

## 2. Configure Supabase Auth

In Supabase Dashboard → Authentication:

1. Enable Email as a provider.
2. Decide whether **Confirm email** is enabled. When it is enabled, the sign-up screen tells the user to verify their email instead of pretending they are already signed in.
3. In URL Configuration, add `odyssey://auth/callback` to the Redirect URLs allow list.
4. Keep Row Level Security enabled on every application table and policy-scope data to `auth.uid()` before connecting real goals, quests, rewards, proofs, or analytics.

## 3. Configure Google

1. In Google Cloud, create a **Web application** OAuth client.
2. Add the Supabase Google callback URL shown in Supabase Dashboard → Authentication → Providers → Google as an authorized redirect URI.
3. Copy the Google client ID and secret into that Google provider configuration in Supabase, then enable it.
4. Add `odyssey://auth/callback` to Supabase Redirect URLs as above. The app opens the system browser for consent and exchanges the redirected authorization code for a native session.

For web development, add the actual development origin (for example, the Expo tunnel URL) to the Google OAuth client's authorized JavaScript origins and Supabase redirect allow list.

## 4. Validate on device

1. Restart Expo after changing `.env`.
2. Create an account with email/password and verify the confirmation-link path when confirmation is enabled.
3. Close and reopen the app to confirm the secure session restores.
4. Use Google sign-in, then confirm it returns to the app and the user is still signed in after restart.
5. Sign out, restart, and verify protected routes redirect to Welcome.
