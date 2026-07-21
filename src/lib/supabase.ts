import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';
import { createClient, processLock, type SupportedStorage } from '@supabase/supabase-js';

// Expo exposes only EXPO_PUBLIC_* variables to app code.
// Publishable Supabase client settings are intentionally safe to ship. Override for previews with EXPO_PUBLIC_*.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://mkeeqikrzoexvrhdeuey.supabase.co';
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rZWVxaWtyem9leHZyaGRldWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzOTIyOTIsImV4cCI6MjA5OTk2ODI5Mn0.k8Db4w01J-Wp8ZP-XzeH1VUA8qgmQj1L6FtGQbBqeg0';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

const nativeSecureStorage: SupportedStorage = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

const storage = Platform.OS === 'web' ? AsyncStorage : nativeSecureStorage;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabasePublishableKey!, {
      auth: {
        storage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        lock: processLock,
      },
    })
  : null;

export const SUPABASE_CONFIGURATION_ERROR =
  'Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env, then restart Expo.';
