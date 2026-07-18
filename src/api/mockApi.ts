import {
  goalAnalytics,
  habitAnalytics,
  initialGoals,
  initialNotifications,
  initialPreferences,
  initialProfile,
  initialQuests,
  initialRewards,
  mathematicsRoadmap,
  overallAnalytics,
} from '../data/mockData';
import type { Goal, Quest } from '../types/domain';
import { toShortTitle } from '../utils/format';
import type { ApiResult, OdysseyApi, ProofAttachment, ReminderPreferences } from './contracts';

const delay = (milliseconds = 280) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const requestId = () => `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const success = <T>(data: T): ApiResult<T> => ({ ok: true, data, requestId: requestId() });
const missing = <T>(noun: string): ApiResult<T> => ({
  ok: false,
  error: { code: 'not_found', message: `${noun} could not be found.`, retryable: false },
  requestId: requestId(),
});

let profile = structuredClone(initialProfile);
let preferences = structuredClone(initialPreferences);
let goals = structuredClone(initialGoals);
let quests = structuredClone(initialQuests);
let rewards = structuredClone(initialRewards);
let notifications = structuredClone(initialNotifications);
let proofAttachments: ProofAttachment[] = [];

const reminderPreferences = (): ReminderPreferences => ({
  questReminders: preferences.questReminders,
  deadlineReminders: preferences.deadlineReminders,
  overdueReminders: preferences.overdueReminders,
  reminderLeadMinutes: preferences.reminderLeadMinutes,
});

export const mockApi: OdysseyApi = {
  auth: {
    async signIn(email, password) {
      await delay();
      if (!email.includes('@') || password.length < 6) {
        return {
          ok: false,
          error: { code: 'validation', message: 'Use a valid email and at least 6 characters.', retryable: false },
          requestId: requestId(),
        };
      }
      return success({ accessToken: 'local-presentation-session', user: profile });
    },
    async signUp(name, email, password) {
      await delay();
      if (!name.trim() || !email.includes('@') || password.length < 8) {
        return {
          ok: false,
          error: { code: 'validation', message: 'Complete every field with a valid email and 8-character password.', retryable: false },
          requestId: requestId(),
        };
      }
      profile = { ...profile, name: name.trim() };
      return success({ accessToken: 'local-presentation-session', user: profile });
    },
    async signOut() {
      await delay(120);
      return success(null);
    },
  },
  profile: {
    async get() {
      await delay(120);
      return success(profile);
    },
    async updatePreferences(input) {
      await delay(180);
      preferences = input;
      return success(preferences);
    },
  },
  goals: {
    async list() {
      await delay(160);
      return success(goals);
    },
    async get(goalId) {
      await delay(120);
      const goal = goals.find((item) => item.id === goalId);
      return goal ? success(goal) : missing('Odyssey');
    },
    async create(input) {
      await delay();
      const goal: Goal = {
        id: `goal-${Date.now()}`,
        title: input.goalTitle,
        shortTitle: toShortTitle(input.goalTitle),
        description: input.startingPoint,
        deadline: input.deadline,
        currentLevel: 1,
        progress: 0,
        accent: '#FFC72C',
        status: 'active',
        bossName: 'The Final Shore',
        bossHealth: 100,
        roadmap: input.levels,
        startingPoint: input.startingPoint,
        availableDays: input.availableDays,
        minutesPerDay: input.minutesPerDay,
        preferredIntensity: input.preferredIntensity,
        constraints: input.constraints,
      };
      goals = [goal, ...goals];
      return success(goal);
    },
    async update(goalId, input) {
      await delay(180);
      const index = goals.findIndex((item) => item.id === goalId);
      if (index < 0) return missing('Odyssey');
      goals[index] = { ...goals[index], ...input };
      return success(goals[index]);
    },
  },
  roadmaps: {
    async generate(input) {
      await delay(900);
      return success({ ...input, levels: structuredClone(mathematicsRoadmap) });
    },
    async accept(input) {
      return mockApi.goals.create(input);
    },
  },
  quests: {
    async list() {
      await delay(140);
      return success(quests);
    },
    async get(questId) {
      await delay(100);
      const quest = quests.find((item) => item.id === questId);
      return quest ? success(quest) : missing('Quest');
    },
    async create(input) {
      await delay(240);
      const quest: Quest = { ...input, id: `quest-${Date.now()}` };
      quests = [...quests, quest];
      return success(quest);
    },
    async update(questId, input) {
      await delay(180);
      const index = quests.findIndex((item) => item.id === questId);
      if (index < 0) return missing('Quest');
      quests[index] = { ...quests[index], ...input };
      return success(quests[index]);
    },
    async remove(questId) {
      await delay(150);
      if (!quests.some((item) => item.id === questId)) return missing('Quest');
      quests = quests.filter((item) => item.id !== questId);
      return success(null);
    },
    async complete(questId, input) {
      await delay(620);
      const questIndex = quests.findIndex((item) => item.id === questId);
      if (questIndex < 0) return missing('Quest');
      const source = quests[questIndex];
      if (source.proofPolicy === 'required' && !input.proofUri) {
        return {
          ok: false,
          error: { code: 'validation', message: 'This quest needs private photo proof before completion.', retryable: false },
          requestId: requestId(),
        };
      }
      const completed: Quest = {
        ...source,
        status: 'completed',
        actualIntensity: input.actualIntensity,
        proofUri: input.proofUri,
        completedAt: new Date().toISOString(),
      };
      quests[questIndex] = completed;
      const goalIndex = goals.findIndex((goal) => goal.id === completed.goalId);
      const bossHealth = goalIndex < 0 ? 0 : Math.max(0, goals[goalIndex].bossHealth - completed.bossDamage);
      if (goalIndex >= 0) goals[goalIndex] = { ...goals[goalIndex], bossHealth };
      profile = { ...profile, xp: profile.xp + completed.rewardXp };
      rewards = { ...rewards, rubies: rewards.rubies + completed.rewardRubies };
      return success({
        quest: completed,
        rewards: { xp: completed.rewardXp, rubies: completed.rewardRubies },
        bossHealth,
      });
    },
  },
  proof: {
    async requestUploadTarget(input) {
      await delay(120);
      const objectKey = `mock-user/completions/${Date.now()}-${input.fileName}`;
      return success({
        uploadUrl: 'https://upload.invalid/odyssey-private-proof',
        objectKey,
        headers: { 'Content-Type': input.contentType },
        expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
      });
    },
    async attach(input) {
      await delay(120);
      const attachment: ProofAttachment = { ...input, id: `proof-${Date.now()}` };
      proofAttachments = [...proofAttachments, attachment];
      return success(attachment);
    },
    async getPrivateUrl(proofId) {
      await delay(100);
      const proof = proofAttachments.find((item) => item.id === proofId);
      if (!proof) return missing('Proof');
      return success({
        proofId,
        url: `https://private.invalid/${proof.objectKey}`,
        expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
      });
    },
  },
  rewards: {
    async get() {
      await delay(120);
      return success(rewards);
    },
    async openChest(chestId) {
      await delay(760);
      if (rewards.unopenedChests < 1) {
        return {
          ok: false,
          error: { code: 'conflict', message: 'No earned chest is waiting to be opened.', retryable: false },
          requestId: requestId(),
        };
      }
      rewards = { ...rewards, unopenedChests: rewards.unopenedChests - 1, rubies: rewards.rubies + 24 };
      return success({ chestId, xp: 120, rubies: 24, cosmetic: 'Sunwake Trail' });
    },
    async applyBoost(boostId) {
      await delay(180);
      const boost = rewards.boosts.find((item) => item.id === boostId);
      if (!boost || boost.quantity < 1) {
        return {
          ok: false,
          error: { code: 'conflict', message: 'That boost is not available.', retryable: false },
          requestId: requestId(),
        };
      }
      rewards = {
        ...rewards,
        activeBoostId: boostId,
        boosts: rewards.boosts.map((item) =>
          item.id === boostId ? { ...item, quantity: item.quantity - 1 } : item,
        ),
      };
      return success(rewards);
    },
    async selectCosmetic(cosmeticId) {
      await delay(160);
      const cosmetic = rewards.cosmetics.find((item) => item.id === cosmeticId);
      if (!cosmetic?.unlocked) {
        return {
          ok: false,
          error: { code: 'conflict', message: 'That cosmetic is still locked.', retryable: false },
          requestId: requestId(),
        };
      }
      rewards = {
        ...rewards,
        cosmetics: rewards.cosmetics.map((item) => ({ ...item, selected: item.id === cosmeticId })),
      };
      return success(rewards);
    },
    async unlockCosmetic(cosmeticId) {
      await delay(180);
      const cosmetic = rewards.cosmetics.find((item) => item.id === cosmeticId);
      const price = cosmetic?.rubyPrice ?? 0;
      if (!cosmetic || cosmetic.unlocked || price < 1 || rewards.rubies < price) {
        return {
          ok: false,
          error: { code: 'conflict', message: cosmetic?.unlocked ? 'That cosmetic is already unlocked.' : 'Not enough rubies for that cosmetic.', retryable: false },
          requestId: requestId(),
        };
      }
      rewards = {
        ...rewards,
        rubies: rewards.rubies - price,
        cosmetics: rewards.cosmetics.map((item) => item.id === cosmeticId ? { ...item, unlocked: true } : item),
      };
      return success(rewards);
    },
    async useStreakProtection(_questId) {
      await delay(180);
      if (rewards.streakProtection < 1) {
        return {
          ok: false,
          error: { code: 'conflict', message: 'No streak protection is available.', retryable: false },
          requestId: requestId(),
        };
      }
      rewards = { ...rewards, streakProtection: rewards.streakProtection - 1 };
      return success(rewards);
    },
  },
  analytics: {
    async overall(period) {
      await delay(160);
      return success({ ...overallAnalytics, period });
    },
    async habit(habitId) {
      await delay(140);
      return success({ ...habitAnalytics, habitId });
    },
    async goal(goalId) {
      await delay(140);
      return success({ ...goalAnalytics, goalId });
    },
  },
  notifications: {
    async list() {
      await delay(100);
      return success(notifications);
    },
    async markRead(notificationId) {
      await delay(100);
      const index = notifications.findIndex((item) => item.id === notificationId);
      if (index < 0) return missing('Notification');
      notifications[index] = { ...notifications[index], read: true };
      return success(notifications[index]);
    },
    async getReminderPreferences() {
      await delay(100);
      return success(reminderPreferences());
    },
    async updateReminderPreferences(input) {
      await delay(140);
      preferences = { ...preferences, ...input };
      return success(reminderPreferences());
    },
  },
};

export function resetMockApiForTests() {
  profile = structuredClone(initialProfile);
  preferences = structuredClone(initialPreferences);
  goals = structuredClone(initialGoals);
  quests = structuredClone(initialQuests);
  rewards = structuredClone(initialRewards);
  notifications = structuredClone(initialNotifications);
  proofAttachments = [];
}
