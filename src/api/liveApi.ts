import type { ApiResult, OdysseyApi } from './contracts';
import { API_BASE_URL, endpoints } from './endpoints';

async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const requestId = globalThis.crypto?.randomUUID?.() ?? `request-${Date.now()}`;
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', 'X-Client-Request-Id': requestId, ...init?.headers },
    });
    const payload = await response.json();
    if (!response.ok) {
      return {
        ok: false,
        error: {
          code: response.status === 401 ? 'unauthorized' : response.status === 404 ? 'not_found' : 'server',
          message: payload?.message ?? 'The Odyssey service did not confirm this request.',
          retryable: response.status >= 500,
        },
        requestId,
      };
    }
    return { ok: true, data: payload as T, requestId };
  } catch {
    return {
      ok: false,
      error: { code: 'offline', message: 'The shore is offline. Your action was not confirmed.', retryable: true },
      requestId,
    };
  }
}

const json = (method: 'POST' | 'PATCH' | 'DELETE', body?: unknown): RequestInit => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
});

export const liveApi: OdysseyApi = {
  auth: {
    signIn: (email, password) => request(endpoints.auth.signIn, json('POST', { email, password })),
    signUp: (name, email, password) => request(endpoints.auth.signUp, json('POST', { name, email, password })),
    signOut: () => request(endpoints.auth.signOut, json('POST')),
  },
  profile: {
    get: () => request(endpoints.profile),
    updatePreferences: (input) => request(endpoints.preferences, json('PATCH', input)),
  },
  goals: {
    list: () => request(endpoints.goals),
    get: (goalId) => request(endpoints.goal(goalId)),
    create: (input) => request(endpoints.goals, json('POST', input)),
    update: (goalId, input) => request(endpoints.goal(goalId), json('PATCH', input)),
  },
  roadmaps: {
    generate: (input) => request(endpoints.roadmapGenerate, json('POST', input)),
    accept: (input) => request(endpoints.roadmapAccept, json('POST', input)),
  },
  quests: {
    list: () => request(endpoints.quests),
    get: (questId) => request(endpoints.quest(questId)),
    create: (input) => request(endpoints.quests, json('POST', input)),
    update: (questId, input) => request(endpoints.quest(questId), json('PATCH', input)),
    remove: (questId) => request(endpoints.quest(questId), json('DELETE')),
    complete: (questId, input) => request(endpoints.questComplete(questId), json('POST', input)),
  },
  proof: {
    requestUploadTarget: (input) => request(endpoints.proofUploadTarget, json('POST', input)),
    attach: (input) => request(endpoints.proofAttach, json('POST', input)),
    getPrivateUrl: (proofId) => request(endpoints.proofPrivateUrl(proofId)),
  },
  rewards: {
    get: () => request(endpoints.rewards),
    openChest: (chestId) => request(endpoints.chest(chestId), json('POST')),
    applyBoost: (boostId) => request(endpoints.boost(boostId), json('POST')),
    selectCosmetic: (cosmeticId) => request(endpoints.cosmetic(cosmeticId), json('POST')),
  },
  analytics: {
    overall: (period) => request(`${endpoints.analyticsOverall}?period=${period}`),
    habit: (habitId) => request(endpoints.analyticsHabit(habitId)),
    goal: (goalId) => request(endpoints.analyticsGoal(goalId)),
  },
  notifications: {
    list: () => request(endpoints.notifications),
    markRead: (notificationId) => request(endpoints.notificationRead(notificationId), json('POST')),
    getReminderPreferences: () => request(endpoints.reminderPreferences),
    updateReminderPreferences: (input) => request(endpoints.reminderPreferences, json('PATCH', input)),
  },
};
