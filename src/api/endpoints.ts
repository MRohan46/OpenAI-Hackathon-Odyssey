/**
 * Replace only the adapter, not screen code, when the teammate-owned backend is ready.
 * No provider URL or secret is embedded in the mobile client.
 */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';

export const endpoints = {
  auth: {
    signIn: '/v1/auth/sign-in',
    signUp: '/v1/auth/sign-up',
    signOut: '/v1/auth/sign-out',
  },
  profile: '/v1/profile',
  preferences: '/v1/profile/preferences',
  goals: '/v1/goals',
  goal: (goalId: string) => `/v1/goals/${goalId}`,
  roadmapGenerate: '/v1/roadmaps/generate',
  roadmapAccept: '/v1/roadmaps/accept',
  quests: '/v1/quests',
  quest: (questId: string) => `/v1/quests/${questId}`,
  questComplete: (questId: string) => `/v1/quests/${questId}/completion`,
  proofUploadTarget: '/v1/proof/upload-target',
  proofAttach: '/v1/proof/attachments',
  proofPrivateUrl: (proofId: string) => `/v1/proof/${proofId}/private-url`,
  rewards: '/v1/rewards',
  chest: (chestId: string) => `/v1/rewards/chests/${chestId}/open`,
  boost: (boostId: string) => `/v1/rewards/boosts/${boostId}/apply`,
  cosmetic: (cosmeticId: string) => `/v1/rewards/cosmetics/${cosmeticId}/select`,
  analyticsOverall: '/v1/analytics/overall',
  analyticsHabit: (habitId: string) => `/v1/analytics/habits/${habitId}`,
  analyticsGoal: (goalId: string) => `/v1/analytics/goals/${goalId}`,
  notifications: '/v1/notifications',
  notificationRead: (notificationId: string) => `/v1/notifications/${notificationId}/read`,
  reminderPreferences: '/v1/notifications/preferences',
} as const;

export const isLiveApiConfigured = API_BASE_URL.length > 0;
