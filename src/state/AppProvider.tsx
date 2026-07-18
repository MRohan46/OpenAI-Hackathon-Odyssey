import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { odysseyApi, type ChestReceipt, type CompletionReceipt } from '../api';
import {
  initialGoals,
  initialNotifications,
  initialPreferences,
  initialProfile,
  initialQuests,
  initialRewardLedger,
  initialRewards,
  mathematicsRoadmap,
} from '../data/mockData';
import type {
  AppPreferences,
  Goal,
  Intensity,
  NotificationItem,
  Quest,
  RewardInventory,
  RewardLedgerEntry,
  RoadmapDraft,
  RoadmapLevel,
  UserProfile,
} from '../types/domain';

const PREFERENCES_KEY = 'odyssey.preferences.v1';

export type AsyncActionState = 'idle' | 'pending' | 'confirmed' | 'failed';

export interface NewQuestInput {
  title: string;
  description: string;
  goalId: string;
  kind: Quest['kind'];
  scheduledAt: string;
  deadlineAt?: string;
  durationMinutes: number;
  priority: Quest['priority'];
  plannedIntensity: Intensity;
  recurrence?: string;
  proofPolicy: Quest['proofPolicy'];
}

interface AppContextValue {
  profile: UserProfile;
  goals: Goal[];
  quests: Quest[];
  rewards: RewardInventory;
  rewardLedger: RewardLedgerEntry[];
  notifications: NotificationItem[];
  preferences: AppPreferences;
  signedIn: boolean;
  activeRoadmapDraft: RoadmapDraft | null;
  activeProofUri: string | null;
  completionState: AsyncActionState;
  completionReceipt: CompletionReceipt | null;
  completionError: string | null;
  chestState: AsyncActionState;
  chestReceipt: ChestReceipt | null;
  signIn(email: string, password: string): Promise<string | null>;
  signUp(name: string, email: string, password: string): Promise<string | null>;
  signOut(): Promise<void>;
  generateRoadmap(input: Omit<RoadmapDraft, 'levels'>): Promise<string | null>;
  updateRoadmapLevel(levelId: string, input: Partial<RoadmapLevel>): void;
  regenerateRoadmapLevel(levelId: string): void;
  moveRoadmapLevel(levelId: string, direction: -1 | 1): void;
  acceptRoadmap(): Promise<Goal | null>;
  updateGoal(goalId: string, input: Partial<Goal>): Promise<string | null>;
  completeGoal(goalId: string): Promise<string | null>;
  createQuest(input: NewQuestInput): Promise<Quest | null>;
  updateQuest(questId: string, input: Partial<Quest>): Promise<string | null>;
  updateQuestSeries(questId: string, input: Partial<Quest>): Promise<string | null>;
  removeQuest(questId: string): Promise<string | null>;
  completeQuest(questId: string, actualIntensity: Intensity, proofUri?: string): Promise<boolean>;
  resetCompletion(): void;
  setActiveProofUri(uri: string | null): void;
  markNotificationRead(notificationId: string): Promise<void>;
  updatePreferences(input: Partial<AppPreferences>): Promise<void>;
  selectCosmetic(cosmeticId: string): void;
  openChest(chestId: string): Promise<boolean>;
  applyBoost(boostId: string): Promise<string | null>;
  unlockCosmetic(cosmeticId: string): Promise<string | null>;
  useStreakProtection(questId?: string): Promise<string | null>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: React.PropsWithChildren) {
  const [profile, setProfile] = useState<UserProfile>(structuredClone(initialProfile));
  const [goals, setGoals] = useState<Goal[]>(structuredClone(initialGoals));
  const [quests, setQuests] = useState<Quest[]>(structuredClone(initialQuests));
  const [rewards, setRewards] = useState<RewardInventory>(structuredClone(initialRewards));
  const [rewardLedger, setRewardLedger] = useState<RewardLedgerEntry[]>(structuredClone(initialRewardLedger));
  const [notifications, setNotifications] = useState<NotificationItem[]>(structuredClone(initialNotifications));
  const [preferences, setPreferences] = useState<AppPreferences>(structuredClone(initialPreferences));
  const [signedIn, setSignedIn] = useState(false);
  const [activeRoadmapDraft, setActiveRoadmapDraft] = useState<RoadmapDraft | null>(null);
  const [activeProofUri, setActiveProofUri] = useState<string | null>(null);
  const [completionState, setCompletionState] = useState<AsyncActionState>('idle');
  const [completionReceipt, setCompletionReceipt] = useState<CompletionReceipt | null>(null);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [chestState, setChestState] = useState<AsyncActionState>('idle');
  const [chestReceipt, setChestReceipt] = useState<ChestReceipt | null>(null);
  const completionMutation = useRef(0);
  const preferencesLoaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(PREFERENCES_KEY)
      .then((stored) => {
        if (stored) setPreferences({ ...initialPreferences, ...JSON.parse(stored) });
      })
      .catch(() => undefined)
      .finally(() => {
        preferencesLoaded.current = true;
      });
  }, []);

  const haptic = useCallback(
    async (kind: 'selection' | 'success' = 'selection') => {
      if (!preferences.haptics) return;
      try {
        if (kind === 'success') {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          await Haptics.selectionAsync();
        }
      } catch {
        // Haptics are enhancement only; interaction remains complete without hardware support.
      }
    },
    [preferences.haptics],
  );

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await odysseyApi.auth.signIn(email, password);
    if (!result.ok) return result.error.message;
    setProfile(result.data.user);
    setSignedIn(true);
    return null;
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const result = await odysseyApi.auth.signUp(name, email, password);
    if (!result.ok) return result.error.message;
    setProfile(result.data.user);
    setSignedIn(true);
    return null;
  }, []);

  const signOut = useCallback(async () => {
    await odysseyApi.auth.signOut();
    setSignedIn(false);
  }, []);

  const generateRoadmap = useCallback(async (input: Omit<RoadmapDraft, 'levels'>) => {
    const result = await odysseyApi.roadmaps.generate(input);
    if (!result.ok) return result.error.message;
    setActiveRoadmapDraft(result.data);
    return null;
  }, []);

  const updateRoadmapLevel = useCallback((levelId: string, input: Partial<RoadmapLevel>) => {
    setActiveRoadmapDraft((draft) =>
      draft
        ? { ...draft, levels: draft.levels.map((level) => (level.id === levelId ? { ...level, ...input } : level)) }
        : draft,
    );
  }, []);

  const regenerateRoadmapLevel = useCallback((levelId: string) => {
    setActiveRoadmapDraft((draft) => {
      if (!draft) return draft;
      return {
        ...draft,
        levels: draft.levels.map((level) => level.id === levelId ? {
          ...level,
          purpose: `Create a practical, evidence-led step toward ${draft.goalTitle.toLowerCase()}.`,
          milestone: `Show clear evidence that ${level.title.toLowerCase()} is complete.`,
          habits: [`Practice ${level.title.toLowerCase()}`, 'Review what changed'],
          tasks: [`Define the evidence for ${level.title.toLowerCase()}`, 'Complete and review the level milestone'],
        } : level),
      };
    });
  }, []);

  const moveRoadmapLevel = useCallback((levelId: string, direction: -1 | 1) => {
    setActiveRoadmapDraft((draft) => {
      if (!draft) return draft;
      const sourceIndex = draft.levels.findIndex((level) => level.id === levelId);
      const targetIndex = sourceIndex + direction;
      if (sourceIndex < 0 || targetIndex < 0 || targetIndex >= draft.levels.length) return draft;
      const levels = [...draft.levels];
      [levels[sourceIndex], levels[targetIndex]] = [levels[targetIndex], levels[sourceIndex]];
      return { ...draft, levels: levels.map((level, index) => ({ ...level, number: index + 1 })) };
    });
  }, []);

  const acceptRoadmap = useCallback(async () => {
    if (!activeRoadmapDraft) return null;
    const result = await odysseyApi.roadmaps.accept(activeRoadmapDraft);
    if (!result.ok) return null;
    setGoals((current) => [result.data, ...current.filter((goal) => goal.id !== result.data.id)]);
    setActiveRoadmapDraft(null);
    await haptic('success');
    return result.data;
  }, [activeRoadmapDraft, haptic]);

  const updateGoal = useCallback(async (goalId: string, input: Partial<Goal>) => {
    const result = await odysseyApi.goals.update(goalId, input);
    if (!result.ok) return result.error.message;
    setGoals((current) => current.map((goal) => (goal.id === goalId ? result.data : goal)));
    return null;
  }, []);

  const completeGoal = useCallback(async (goalId: string) => {
    const goal = goals.find((item) => item.id === goalId);
    if (!goal || goal.currentLevel < 10 || goal.bossHealth > 0) return 'The final level and boss must be completed before this Odyssey can close.';
    const completedAt = new Date().toISOString();
    const result = await odysseyApi.goals.update(goalId, { status: 'completed', progress: 100, completedAt });
    if (!result.ok) return result.error.message;
    setGoals((current) => current.map((item) => item.id === goalId ? result.data : item));
    await haptic('success');
    return null;
  }, [goals, haptic]);

  const createQuest = useCallback(async (input: NewQuestInput) => {
    const result = await odysseyApi.quests.create({
      ...input,
      seriesId: input.kind === 'habit' ? `series-${Date.now()}` : undefined,
      status: 'scheduled',
      rewardXp: input.priority === 'critical' ? 120 : input.priority === 'high' ? 90 : 45,
      rewardRubies: input.priority === 'critical' ? 16 : input.priority === 'high' ? 12 : 6,
      bossDamage: input.priority === 'critical' ? 10 : input.priority === 'high' ? 7 : 3,
    });
    if (!result.ok) return null;
    setQuests((current) => [...current, result.data]);
    await haptic();
    return result.data;
  }, [haptic]);

  const updateQuest = useCallback(async (questId: string, input: Partial<Quest>) => {
    const result = await odysseyApi.quests.update(questId, input);
    if (!result.ok) return result.error.message;
    setQuests((current) => current.map((quest) => (quest.id === questId ? result.data : quest)));
    return null;
  }, []);

  const updateQuestSeries = useCallback(async (questId: string, input: Partial<Quest>) => {
    const source = quests.find((quest) => quest.id === questId);
    if (!source?.seriesId) return updateQuest(questId, input);
    const editable = quests.filter((quest) => quest.seriesId === source.seriesId && quest.status !== 'completed' && quest.status !== 'missed');
    const results = await Promise.all(editable.map((quest) => odysseyApi.quests.update(quest.id, input)));
    const failure = results.find((result) => !result.ok);
    if (failure && !failure.ok) return failure.error.message;
    const updated = new Map(results.filter((result) => result.ok).map((result) => [result.data.id, result.data]));
    setQuests((current) => current.map((quest) => updated.get(quest.id) ?? quest));
    return null;
  }, [quests, updateQuest]);

  const removeQuest = useCallback(async (questId: string) => {
    const result = await odysseyApi.quests.remove(questId);
    if (!result.ok) return result.error.message;
    setQuests((current) => current.filter((quest) => quest.id !== questId));
    return null;
  }, []);

  const completeQuest = useCallback(
    async (questId: string, actualIntensity: Intensity, proofUri?: string) => {
      const mutation = ++completionMutation.current;
      setCompletionState('pending');
      setCompletionReceipt(null);
      setCompletionError(null);
      setQuests((current) =>
        current.map((quest) => (quest.id === questId ? { ...quest, status: 'completionPending' } : quest)),
      );
      const result = await odysseyApi.quests.complete(questId, {
        actualIntensity,
        proofUri,
        clientMutationId: `complete-${questId}-${mutation}`,
      });
      if (mutation !== completionMutation.current) return false;
      if (!result.ok) {
        setQuests((current) =>
          current.map((quest) => (quest.id === questId ? { ...quest, status: 'scheduled' } : quest)),
        );
        setCompletionError(result.error.message);
        setCompletionState('failed');
        return false;
      }
      setQuests((current) => current.map((quest) => (quest.id === questId ? result.data.quest : quest)));
      setGoals((current) =>
        current.map((goal) =>
          goal.id === result.data.quest.goalId ? { ...goal, bossHealth: result.data.bossHealth } : goal,
        ),
      );
      setProfile((current) => ({ ...current, xp: current.xp + result.data.rewards.xp }));
      setRewards((current) => ({ ...current, rubies: current.rubies + result.data.rewards.rubies }));
      setRewardLedger((current) => [{
        id: `ledger-${Date.now()}`,
        createdAt: result.data.quest.completedAt ?? new Date().toISOString(),
        kind: 'quest',
        title: `${result.data.quest.title} completed`,
        xp: result.data.rewards.xp,
        rubies: result.data.rewards.rubies,
      }, ...current]);
      setCompletionReceipt(result.data);
      setCompletionState('confirmed');
      setActiveProofUri(null);
      await haptic('success');
      return true;
    },
    [haptic],
  );

  const resetCompletion = useCallback(() => {
    completionMutation.current += 1;
    setCompletionState('idle');
    setCompletionReceipt(null);
    setCompletionError(null);
  }, []);

  const markNotificationRead = useCallback(async (notificationId: string) => {
    const result = await odysseyApi.notifications.markRead(notificationId);
    if (result.ok) {
      setNotifications((current) => current.map((item) => (item.id === notificationId ? result.data : item)));
    }
  }, []);

  const updatePreferences = useCallback(async (input: Partial<AppPreferences>) => {
    const next = { ...preferences, ...input };
    setPreferences(next);
    if (preferencesLoaded.current) await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(next));
    await odysseyApi.profile.updatePreferences(next);
  }, [preferences]);

  const selectCosmetic = useCallback((cosmeticId: string) => {
    setRewards((current) => ({
      ...current,
      cosmetics: current.cosmetics.map((cosmetic) => ({
        ...cosmetic,
        selected: cosmetic.id === cosmeticId && cosmetic.unlocked,
      })),
    }));
    const cosmetic = rewards.cosmetics.find((item) => item.id === cosmeticId);
    if (cosmetic?.unlocked) setProfile((current) => ({ ...current, selectedCosmetic: cosmetic.name }));
  }, [rewards.cosmetics]);

  const openChest = useCallback(async (chestId: string) => {
    setChestState('pending');
    setChestReceipt(null);
    const result = await odysseyApi.rewards.openChest(chestId);
    if (!result.ok) {
      setChestState('failed');
      return false;
    }
    setChestReceipt(result.data);
    setChestState('confirmed');
    setRewards((current) => ({
      ...current,
      unopenedChests: Math.max(0, current.unopenedChests - 1),
      rubies: current.rubies + result.data.rubies,
    }));
    setProfile((current) => ({ ...current, xp: current.xp + result.data.xp }));
    setRewardLedger((current) => [{ id: `ledger-${Date.now()}`, createdAt: new Date().toISOString(), kind: 'chest', title: 'Earned chest opened', xp: result.data.xp, rubies: result.data.rubies }, ...current]);
    await haptic('success');
    return true;
  }, [haptic]);

  const applyBoost = useCallback(async (boostId: string) => {
    const result = await odysseyApi.rewards.applyBoost(boostId);
    if (!result.ok) return result.error.message;
    const boost = rewards.boosts.find((item) => item.id === boostId);
    setRewards(result.data);
    setRewardLedger((current) => [{ id: `ledger-${Date.now()}`, createdAt: new Date().toISOString(), kind: 'boost', title: `${boost?.name ?? 'Boost'} prepared`, xp: 0, rubies: 0 }, ...current]);
    await haptic('success');
    return null;
  }, [haptic, rewards.boosts]);

  const unlockCosmetic = useCallback(async (cosmeticId: string) => {
    const cosmetic = rewards.cosmetics.find((item) => item.id === cosmeticId);
    const result = await odysseyApi.rewards.unlockCosmetic(cosmeticId);
    if (!result.ok) return result.error.message;
    setRewards(result.data);
    setRewardLedger((current) => [{ id: `ledger-${Date.now()}`, createdAt: new Date().toISOString(), kind: 'cosmetic', title: `${cosmetic?.name ?? 'Cosmetic'} unlocked`, xp: 0, rubies: -(cosmetic?.rubyPrice ?? 0) }, ...current]);
    await haptic('success');
    return null;
  }, [haptic, rewards.cosmetics]);

  const useStreakProtection = useCallback(async (questId?: string) => {
    const quest = quests.find((item) => item.id === questId);
    const result = await odysseyApi.rewards.useStreakProtection(questId);
    if (!result.ok) return result.error.message;
    setRewards(result.data);
    if (questId) setQuests((current) => current.map((item) => item.id === questId ? { ...item, streakProtected: true } : item));
    setRewardLedger((current) => [{ id: `ledger-${Date.now()}`, createdAt: new Date().toISOString(), kind: 'streakProtection', title: quest ? `Streak protected after ${quest.title}` : 'Streak protection reserved for the next eligible miss', xp: 0, rubies: 0 }, ...current]);
    await haptic('success');
    return null;
  }, [haptic, quests]);

  const value = useMemo<AppContextValue>(
    () => ({
      profile,
      goals,
      quests,
      rewards,
      rewardLedger,
      notifications,
      preferences,
      signedIn,
      activeRoadmapDraft,
      activeProofUri,
      completionState,
      completionReceipt,
      completionError,
      chestState,
      chestReceipt,
      signIn,
      signUp,
      signOut,
      generateRoadmap,
      updateRoadmapLevel,
      regenerateRoadmapLevel,
      moveRoadmapLevel,
      acceptRoadmap,
      updateGoal,
      completeGoal,
      createQuest,
      updateQuest,
      updateQuestSeries,
      removeQuest,
      completeQuest,
      resetCompletion,
      setActiveProofUri,
      markNotificationRead,
      updatePreferences,
      selectCosmetic,
      openChest,
      applyBoost,
      unlockCosmetic,
      useStreakProtection,
    }),
    [
      profile,
      goals,
      quests,
      rewards,
      rewardLedger,
      notifications,
      preferences,
      signedIn,
      activeRoadmapDraft,
      activeProofUri,
      completionState,
      completionReceipt,
      completionError,
      chestState,
      chestReceipt,
      signIn,
      signUp,
      signOut,
      generateRoadmap,
      updateRoadmapLevel,
      regenerateRoadmapLevel,
      moveRoadmapLevel,
      acceptRoadmap,
      updateGoal,
      completeGoal,
      createQuest,
      updateQuest,
      updateQuestSeries,
      removeQuest,
      completeQuest,
      resetCompletion,
      markNotificationRead,
      updatePreferences,
      selectCosmetic,
      openChest,
      applyBoost,
      unlockCosmetic,
      useStreakProtection,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}

export function createExampleRoadmapDraft(): RoadmapDraft {
  return {
    goalTitle: 'Prepare for my mathematics examination',
    deadline: '2026-09-25',
    startingPoint: 'I know the foundations but need reliable timed practice.',
    availableDays: ['Mon', 'Wed', 'Fri', 'Sat'],
    minutesPerDay: 45,
    preferredIntensity: 'normal',
    constraints: 'Keep Sunday free and make the final three weeks exam-focused.',
    levels: structuredClone(mathematicsRoadmap),
  };
}
