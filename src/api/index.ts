import { isLiveApiConfigured } from './endpoints';
import { liveApi } from './liveApi';
import { mockApi } from './mockApi';
import { supabaseApi, usingSupabaseData } from './supabaseApi';

// Supabase is the real product data source whenever this build is configured.
// The mock adapter remains available only for the explicit unauthenticated presentation mode.
export const odysseyApi = usingSupabaseData ? supabaseApi : isLiveApiConfigured ? liveApi : mockApi;
export { endpoints, isLiveApiConfigured } from './endpoints';
export { usingSupabaseData } from './supabaseApi';
export type * from './contracts';
