import type { Intensity, Goal, GoalAnalytics, HabitAnalytics, NotificationItem, OverallAnalytics, Quest, RewardInventory, RewardLedgerEntry, RoadmapLevel, UserProfile, AppPreferences, RoadmapDraft } from '../types/domain';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { ApiResult, ChestReceipt, CompletionInput, OdysseyApi, PrivateProofUrl, ProofAttachment, ProofAttachmentInput, ProofUploadInput, ProofUploadTarget, ReminderPreferences, Session } from './contracts';
import { RequestTimeoutError, withTimeout } from './withTimeout';

type Row = Record<string, any>;
const requestId = () => globalThis.crypto?.randomUUID?.() ?? `supabase-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const roadmapFunctionName = process.env.EXPO_PUBLIC_ROADMAP_FUNCTION_NAME?.trim() || 'generate-roadmap';
const failed = <T>(message: string, code: 'offline' | 'validation' | 'unauthorized' | 'not_found' | 'conflict' | 'server' = 'server'): ApiResult<T> => ({ ok: false, error: { code, message, retryable: code === 'offline' || code === 'server' }, requestId: requestId() });
const success = <T>(data: T): ApiResult<T> => ({ ok: true, data, requestId: requestId() });
const apiError = <T>(error: { message: string; code?: string } | null, fallback: string): ApiResult<T> => failed(error?.message ?? fallback, error?.code === 'PGRST116' ? 'not_found' : 'server');

function profileFrom(row: Row): UserProfile {
  return { id: row.id, name: row.name, handle: row.handle, accountLevel: row.account_level, xp: row.xp, xpToNextLevel: row.xp_to_next_level, overallStreak: row.overall_streak, avatarSeed: row.avatar_seed, selectedCosmetic: row.selected_cosmetic };
}

function preferencesFrom(row: Row): AppPreferences {
  return { reducedMotionOverride: row.reduced_motion_override, haptics: row.haptics, highContrast: row.high_contrast, graphicsQuality: row.graphics_quality, questReminders: row.quest_reminders, deadlineReminders: row.deadline_reminders, overdueReminders: row.overdue_reminders, reminderLeadMinutes: row.reminder_lead_minutes };
}

function levelFrom(row: Row): RoadmapLevel {
  return { id: row.id, number: row.number, title: row.title, purpose: row.purpose, status: row.status, milestone: row.milestone, bossType: row.boss_type, bossName: row.boss_name ?? undefined, bossHealth: row.boss_health ?? undefined, habits: row.habits ?? [], tasks: row.tasks ?? [] };
}

function goalFrom(row: Row): Goal {
  const levels = (row.roadmap_levels ?? []).map(levelFrom).sort((a: RoadmapLevel, b: RoadmapLevel) => a.number - b.number);
  return { id: row.id, title: row.title, shortTitle: row.short_title, description: row.description, deadline: row.deadline, currentLevel: row.current_level, progress: row.progress, accent: row.accent, status: row.status, bossName: row.boss_name, bossHealth: row.boss_health, roadmap: levels, completedAt: row.completed_at ?? undefined, victoryNote: row.victory_note ?? undefined, startingPoint: row.starting_point ?? undefined, availableDays: row.available_days ?? [], minutesPerDay: row.minutes_per_day ?? undefined, preferredIntensity: row.preferred_intensity ?? undefined, constraints: row.constraints ?? undefined };
}

function questFrom(row: Row): Quest {
  return { id: row.id, goalId: row.goal_id, title: row.title, description: row.description, kind: row.kind, status: row.status, scheduledAt: row.scheduled_at, deadlineAt: row.deadline_at ?? undefined, durationMinutes: row.duration_minutes, priority: row.priority, plannedIntensity: row.planned_intensity, actualIntensity: row.actual_intensity ?? undefined, recurrence: row.recurrence ?? undefined, proofPolicy: row.proof_policy, proofUri: row.proof_object_key ?? undefined, rewardXp: row.reward_xp, rewardRubies: row.reward_rubies, bossDamage: row.boss_damage, completedAt: row.completed_at ?? undefined, seriesId: row.series_id ?? undefined, streakProtected: row.streak_protected };
}

function rewardsFrom(row: Row): RewardInventory {
  return { rubies: row.rubies, unopenedChests: row.unopened_chests, boosts: row.boosts ?? [], cosmetics: row.cosmetics ?? [], streakProtection: row.streak_protection, activeBoostId: row.active_boost_id ?? undefined };
}

function notificationFrom(row: Row): NotificationItem {
  return { id: row.id, title: row.title, body: row.body, createdAt: row.created_at, read: row.read, kind: row.kind, targetRoute: row.target_route ?? undefined };
}

function ledgerFrom(row: Row): RewardLedgerEntry {
  return { id: row.id, createdAt: row.created_at, kind: row.kind, title: row.title, xp: row.xp, rubies: row.rubies };
}

async function rpc<T>(name: string, args?: Record<string, unknown>): Promise<ApiResult<T>> {
  if (!supabase) return failed('Supabase is not configured.');
  const { data, error } = await supabase.rpc(name as never, args as never);
  return error ? apiError(error, 'Odyssey could not confirm this request.') : success(data as T);
}

async function uploadProof(uri: string): Promise<{ objectKey: string } | { error: string }> {
  if (!supabase) return { error: 'Supabase is not configured.' };
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { error: 'Sign in before uploading proof.' };
  const response = await fetch(uri);
  if (!response.ok) return { error: 'Odyssey could not read the selected proof image.' };
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > 10 * 1024 * 1024) return { error: 'Proof images must be 10 MB or smaller.' };
  const contentType = response.headers.get('content-type')?.split(';')[0] || (uri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
  if (!['image/jpeg', 'image/png', 'image/heic'].includes(contentType)) return { error: 'Choose a JPEG, PNG, or HEIC proof image.' };
  const extension = contentType === 'image/png' ? 'png' : contentType === 'image/heic' ? 'heic' : 'jpg';
  const objectKey = `${userId}/proofs/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from('odyssey-private-proof').upload(objectKey, bytes, { contentType, upsert: false });
  return error ? { error: error.message } : { objectKey };
}

function roadmapInput(input: Omit<RoadmapDraft, 'levels'>) {
  return { goalTitle: input.goalTitle, deadline: input.deadline, startingPoint: input.startingPoint, availableDays: input.availableDays, minutesPerDay: input.minutesPerDay, preferredIntensity: input.preferredIntensity, constraints: input.constraints };
}

export const supabaseApi: OdysseyApi = {
  auth: {
    async signIn(email, password) {
      if (!supabase) return failed('Supabase is not configured.');
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.session) return apiError(error, 'Odyssey could not sign you in.');
      const profile = await supabaseApi.profile.get();
      return profile.ok ? success<Session>({ accessToken: data.session.access_token, user: profile.data }) : profile;
    },
    async signUp(name, email, password) {
      if (!supabase) return failed('Supabase is not configured.');
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
      if (error || !data.session) return apiError(error, 'Confirm your email before signing in.');
      const profile = await supabaseApi.profile.get();
      return profile.ok ? success<Session>({ accessToken: data.session.access_token, user: profile.data }) : profile;
    },
    async signOut() { if (!supabase) return failed('Supabase is not configured.'); const { error } = await supabase.auth.signOut(); return error ? apiError(error, 'Odyssey could not sign you out.') : success(null); },
  },
  profile: {
    async get() {
      const result = await rpc<Row>('odyssey_ensure_profile');
      return result.ok ? success(profileFrom(result.data)) : result;
    },
    async updatePreferences(input) {
      if (!supabase) return failed('Supabase is not configured.');
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return failed('Sign in to update preferences.', 'unauthorized');
      const { data, error } = await supabase.from('preferences').update({ reduced_motion_override: input.reducedMotionOverride, haptics: input.haptics, high_contrast: input.highContrast, graphics_quality: input.graphicsQuality, quest_reminders: input.questReminders, deadline_reminders: input.deadlineReminders, overdue_reminders: input.overdueReminders, reminder_lead_minutes: input.reminderLeadMinutes }).eq('user_id', userData.user.id).select().single();
      return error ? apiError(error, 'Odyssey could not save preferences.') : success(preferencesFrom(data));
    },
  },
  goals: {
    async list() { if (!supabase) return failed('Supabase is not configured.'); const { data, error } = await supabase.from('goals').select('*, roadmap_levels(*)').order('created_at', { ascending: false }); return error ? apiError(error, 'Odyssey could not load your journeys.') : success((data ?? []).map(goalFrom)); },
    async get(goalId) { if (!supabase) return failed('Supabase is not configured.'); const { data, error } = await supabase.from('goals').select('*, roadmap_levels(*)').eq('id', goalId).single(); return error ? apiError(error, 'Odyssey could not load this journey.') : success(goalFrom(data)); },
    async create(input) { const accepted = await rpc<Row>('odyssey_accept_roadmap', { p_draft: input }); if (!accepted.ok) return accepted; return supabaseApi.goals.get(accepted.data.id); },
    async update(goalId, input) {
      if (input.status === 'completed') return rpc<Row>('odyssey_complete_goal', { p_goal_id: goalId, p_victory_note: input.victoryNote ?? null }).then((result) => result.ok ? success(goalFrom(result.data)) : result);
      const result = await rpc<Row>('odyssey_update_goal', { p_goal_id: goalId, p_patch: input });
      return result.ok ? supabaseApi.goals.get(result.data.id) : result;
    },
  },
  roadmaps: {
    async generate(input) {
      if (!supabase) return failed('Supabase is not configured.');
      try {
        const { data, error } = await withTimeout(
          supabase.functions.invoke(roadmapFunctionName, { body: roadmapInput(input) }),
          120_000,
          `Roadmap generation took more than two minutes. Check that the ${roadmapFunctionName} Edge Function is deployed and has Groq secrets, then try again.`,
        );
        return error ? failed(error.message, 'server') : success(data as RoadmapDraft);
      } catch (error) {
        return failed(
          error instanceof RequestTimeoutError
            ? error.message
            : 'Odyssey could not reach the roadmap service. Your goal has not been created.',
          'server',
        );
      }
    },
    async accept(input) { const result = await rpc<Row>('odyssey_accept_roadmap', { p_draft: input }); return result.ok ? supabaseApi.goals.get(result.data.id) : result; },
  },
  quests: {
    async list() { if (!supabase) return failed('Supabase is not configured.'); const { data, error } = await supabase.from('quests').select('*').order('scheduled_at', { ascending: true }); return error ? apiError(error, 'Odyssey could not load your quests.') : success((data ?? []).map(questFrom)); },
    async get(questId) { if (!supabase) return failed('Supabase is not configured.'); const { data, error } = await supabase.from('quests').select('*').eq('id', questId).single(); return error ? apiError(error, 'Odyssey could not load this quest.') : success(questFrom(data)); },
    async create(input) { const result = await rpc<Row>('odyssey_create_quest', { p_input: input }); return result.ok ? success(questFrom(result.data)) : result; },
    async update(questId, input) { const result = await rpc<Row>('odyssey_update_quest', { p_quest_id: questId, p_patch: input }); return result.ok ? success(questFrom(result.data)) : result; },
    async remove(questId) { const result = await rpc<null>('odyssey_delete_quest', { p_quest_id: questId }); return result.ok ? success(null) : result; },
    async complete(questId, input: CompletionInput) {
      let objectKey = input.proofUri;
      if (objectKey?.startsWith('file:') || objectKey?.startsWith('content:') || objectKey?.startsWith('blob:')) { const uploaded = await uploadProof(objectKey); if ('error' in uploaded) return failed(uploaded.error, 'validation'); objectKey = uploaded.objectKey; }
      const result = await rpc<Row>('odyssey_complete_quest', { p_quest_id: questId, p_actual_intensity: input.actualIntensity, p_proof_object_key: objectKey ?? null, p_client_mutation_id: input.clientMutationId });
      return result.ok ? success({ quest: questFrom(result.data.quest), rewards: result.data.rewards, bossHealth: result.data.bossHealth }) : result;
    },
  },
  proof: {
    async requestUploadTarget(input: ProofUploadInput) { if (!supabase) return failed('Supabase is not configured.'); const { data: userData } = await supabase.auth.getUser(); if (!userData.user) return failed('Sign in before uploading proof.', 'unauthorized'); const objectKey = `${userData.user.id}/proofs/${crypto.randomUUID()}-${input.fileName.replace(/[^A-Za-z0-9._-]/g, '_')}`; const { data, error } = await supabase.storage.from('odyssey-private-proof').createSignedUploadUrl(objectKey); return error ? apiError(error, 'Odyssey could not prepare proof upload.') : success({ uploadUrl: data.signedUrl, objectKey, headers: { 'Content-Type': input.contentType }, expiresAt: new Date(Date.now() + 60_000).toISOString() } as ProofUploadTarget); },
    async attach(input: ProofAttachmentInput) { const result = await rpc<Row>('odyssey_attach_proof', { p_quest_id: input.completionId, p_object_key: input.objectKey, p_captured_at: input.capturedAt }); return result.ok ? success({ id: result.data.id, ...input } as ProofAttachment) : result; },
    async getPrivateUrl(proofId) { if (!supabase) return failed('Supabase is not configured.'); const { data: proof, error: proofError } = await supabase.from('proofs').select('*').eq('id', proofId).single(); if (proofError) return apiError(proofError, 'Odyssey could not find this proof.'); const { data, error } = await supabase.storage.from('odyssey-private-proof').createSignedUrl(proof.object_key, 60); return error ? apiError(error, 'Odyssey could not prepare this private proof.') : success({ proofId, url: data.signedUrl, expiresAt: new Date(Date.now() + 60_000).toISOString() } as PrivateProofUrl); },
  },
  rewards: {
    async get() { if (!supabase) return failed('Supabase is not configured.'); const { data, error } = await supabase.from('reward_inventory').select('*').single(); return error ? apiError(error, 'Odyssey could not load rewards.') : success(rewardsFrom(data)); },
    async ledger() { if (!supabase) return failed('Supabase is not configured.'); const { data, error } = await supabase.from('reward_ledger').select('*').order('created_at', { ascending: false }); return error ? apiError(error, 'Odyssey could not load reward history.') : success<RewardLedgerEntry[]>((data ?? []).map(ledgerFrom)); },
    async openChest(chestId) { return rpc<ChestReceipt>('odyssey_open_chest', { p_chest_id: chestId }); },
    async applyBoost(boostId) { const result = await rpc<Row>('odyssey_apply_boost', { p_boost_id: boostId }); return result.ok ? success(rewardsFrom(result.data)) : result; },
    async selectCosmetic(cosmeticId) { const result = await rpc<Row>('odyssey_select_cosmetic', { p_cosmetic_id: cosmeticId }); return result.ok ? success(rewardsFrom(result.data)) : result; },
    async unlockCosmetic(cosmeticId) { const result = await rpc<Row>('odyssey_unlock_cosmetic', { p_cosmetic_id: cosmeticId }); return result.ok ? success(rewardsFrom(result.data)) : result; },
    async useStreakProtection(questId) { const result = await rpc<Row>('odyssey_use_streak_protection', { p_quest_id: questId ?? null }); return result.ok ? success(rewardsFrom(result.data)) : result; },
  },
  analytics: {
    async overall(period) { const list = await supabaseApi.quests.list(); if (!list.ok) return list; const now = new Date(); const range = period === 'week' ? 7 : 30; const start = new Date(now); start.setDate(start.getDate() - range + 1); const relevant = list.data.filter((quest) => new Date(quest.scheduledAt) >= start); const completed = relevant.filter((quest) => quest.status === 'completed'); const intensity = { light: 0, normal: 0, intense: 0 }; completed.forEach((quest) => { intensity[(quest.actualIntensity ?? quest.plannedIntensity) as Intensity] += 1; }); const daily = Array.from({ length: period === 'week' ? 7 : 30 }, (_, index) => { const date = new Date(start); date.setDate(start.getDate() + index); const key = date.toDateString(); const assigned = relevant.filter((quest) => new Date(quest.scheduledAt).toDateString() === key); const complete = assigned.filter((quest) => quest.status === 'completed').length; return { label: period === 'week' ? date.toLocaleDateString(undefined, { weekday: 'short' }) : String(date.getDate()), value: assigned.length ? Math.round((complete / assigned.length) * 100) : 0 }; }); const total = relevant.length; return success<OverallAnalytics>({ period, questsCompleted: completed.length, completionRate: total ? Math.round((completed.length / total) * 100) : 0, consistency: total ? Math.round((completed.length / total) * 100) : 0, xpEarned: completed.reduce((sum, quest) => sum + quest.rewardXp, 0), rubiesEarned: completed.reduce((sum, quest) => sum + quest.rewardRubies, 0), intensity, daily }); },
    async habit(habitId) { const list = await supabaseApi.quests.list(); if (!list.ok) return list; const quests = list.data.filter((quest) => quest.id === habitId || quest.seriesId === habitId); const completed = quests.filter((quest) => quest.status === 'completed'); const intensity = { light: 0, normal: 0, intense: 0 }; completed.forEach((quest) => { intensity[(quest.actualIntensity ?? quest.plannedIntensity) as Intensity] += 1; }); return success<HabitAnalytics>({ habitId, currentStreak: 0, longestStreak: 0, scheduled: quests.length, completed: completed.length, missed: quests.filter((quest) => quest.status === 'missed').length, intensity, weekly: [] }); },
    async goal(goalId) { const [goal, quests] = await Promise.all([supabaseApi.goals.get(goalId), supabaseApi.quests.list()]); if (!goal.ok) return goal; if (!quests.ok) return quests; const connected = quests.data.filter((quest) => quest.goalId === goalId); const complete = connected.filter((quest) => quest.status === 'completed').length; const elapsed = Math.max(0, Date.now() - new Date(goal.data.deadline).setHours(0, 0, 0, 0)); return success<GoalAnalytics>({ goalId, roadmapProgress: goal.data.progress, completedStages: goal.data.roadmap.filter((level) => level.status === 'completed').length, connectedQuestCompletion: connected.length ? Math.round((complete / connected.length) * 100) : 0, bossHealth: goal.data.bossHealth, deadlineProgress: elapsed ? 100 : 0 }); },
  },
  notifications: {
    async list() { if (!supabase) return failed('Supabase is not configured.'); const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }); return error ? apiError(error, 'Odyssey could not load notifications.') : success((data ?? []).map(notificationFrom)); },
    async markRead(notificationId) { if (!supabase) return failed('Supabase is not configured.'); const { data, error } = await supabase.from('notifications').update({ read: true }).eq('id', notificationId).select().single(); return error ? apiError(error, 'Odyssey could not update this notification.') : success(notificationFrom(data)); },
    async getReminderPreferences() { if (!supabase) return failed('Supabase is not configured.'); const { data, error } = await supabase.from('preferences').select('*').single(); return error ? apiError(error, 'Odyssey could not load reminder preferences.') : success<ReminderPreferences>(preferencesFrom(data)); },
    async updateReminderPreferences(input) { if (!supabase) return failed('Supabase is not configured.'); const { data, error } = await supabase.from('preferences').update({ quest_reminders: input.questReminders, deadline_reminders: input.deadlineReminders, overdue_reminders: input.overdueReminders, reminder_lead_minutes: input.reminderLeadMinutes }).select().single(); return error ? apiError(error, 'Odyssey could not save reminder preferences.') : success<ReminderPreferences>(preferencesFrom(data)); },
  },
};

export const usingSupabaseData = isSupabaseConfigured;
