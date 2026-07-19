import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { odysseyApi, usingSupabaseData, type ChestReceipt, type CompletionReceipt } from '../api';
import { mockApi } from '../api/mockApi';
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
import { supabase, SUPABASE_CONFIGURATION_ERROR } from '../lib/supabase';

const PREFERENCES_KEY = 'odyssey.preferences.v1';
const PRESENTATION_SESSION_KEY = 'odyssey.presentation-session.v1';

const presentationSessionActive = () => {
  if (Platform.OS !== 'web' || typeof sessionStorage === 'undefined') return false;
  try {
    return sessionStorage.getItem(PRESENTATION_SESSION_KEY) === 'active';
  } catch {
    return false;
  }
};

const setPresentationSession = (active: boolean) => {
  if (Platform.OS !== 'web' || typeof sessionStorage === 'undefined') return;
  try {
    if (active) sessionStorage.setItem(PRESENTATION_SESSION_KEY, 'active');
    else sessionStorage.removeItem(PRESENTATION_SESSION_KEY);
  } catch {
    // A blocked storage API must not prevent the in-memory presentation session.
  }
};

const emptyProfile: UserProfile = {
  id: '', name: 'Odyssey traveler', handle: '@traveler', accountLevel: 1, xp: 0, xpToNextLevel: 500, overallStreak: 0, avatarSeed: 'shore-sunrise', selectedCosmetic: 'Sea Glass Halo',
};
const emptyRewards: RewardInventory = { rubies: 0, unopenedChests: 0, boosts: [], cosmetics: [], streakProtection: 0 };

WebBrowser.maybeCompleteAuthSession();

export type AsyncActionState = 'idle' | 'pending' | 'confirmed' | 'failed';
export interface SignUpResult {
  error: string | null;
  confirmationRequired: boolean;
}

export interface RoadmapAcceptanceResult {
  goal: Goal | null;
  error: string | null;
}

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
  presentationMode: boolean;
  authLoading: boolean;
  activeRoadmapDraft: RoadmapDraft | null;
  activeProofUri: string | null;
  completionState: AsyncActionState;
  completionReceipt: CompletionReceipt | null;
  completionError: string | null;
  chestState: AsyncActionState;
  chestReceipt: ChestReceipt | null;
  signIn(email: string, password: string): Promise<string | null>;
  signUp(name: string, email: string, password: string): Promise<SignUpResult>;
  signInWithGoogle(): Promise<string | null>;
  enterPresentationMode(): void;
  signOut(): Promise<void>;
  syncAuthSession(): Promise<string | null>;
  generateRoadmap(input: Omit<RoadmapDraft, 'levels'>): Promise<string | null>;
  updateRoadmapLevel(levelId: string, input: Partial<RoadmapLevel>): void;
  regenerateRoadmapLevel(levelId: string): Promise<string | null>;
  moveRoadmapLevel(levelId: string, direction: -1 | 1): void;
  acceptRoadmap(): Promise<RoadmapAcceptanceResult>;
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
  selectCosmetic(cosmeticId: string): Promise<void>;
  openChest(chestId: string): Promise<boolean>;
  applyBoost(boostId: string): Promise<string | null>;
  unlockCosmetic(cosmeticId: string): Promise<string | null>;
  useStreakProtection(questId?: string): Promise<string | null>;
}

const AppContext = createContext<AppContextValue | null>(null);

const userProfile = (user: { id: string; email?: string; user_metadata?: Record<string, unknown> }): UserProfile => {
  const displayName = typeof user.user_metadata?.full_name === 'string'
    ? user.user_metadata.full_name
    : typeof user.user_metadata?.name === 'string'
      ? user.user_metadata.name
      : user.email?.split('@')[0] ?? 'Odyssey traveler';
  const handle = user.email?.split('@')[0]?.replace(/[^a-z0-9_]/gi, '').toLowerCase() || 'traveler';
  return { ...structuredClone(initialProfile), id: user.id, name: displayName, handle: `@${handle}`, avatarSeed: user.id };
};

const authError = (message?: string) => message ?? 'Odyssey could not complete authentication. Please try again.';

export function AppProvider({ children }: React.PropsWithChildren) {
  const [profile, setProfile] = useState<UserProfile>(usingSupabaseData ? emptyProfile : structuredClone(initialProfile));
  const [goals, setGoals] = useState<Goal[]>(usingSupabaseData ? [] : structuredClone(initialGoals));
  const [quests, setQuests] = useState<Quest[]>(usingSupabaseData ? [] : structuredClone(initialQuests));
  const [rewards, setRewards] = useState<RewardInventory>(usingSupabaseData ? emptyRewards : structuredClone(initialRewards));
  const [rewardLedger, setRewardLedger] = useState<RewardLedgerEntry[]>(usingSupabaseData ? [] : structuredClone(initialRewardLedger));
  const [notifications, setNotifications] = useState<NotificationItem[]>(usingSupabaseData ? [] : structuredClone(initialNotifications));
  const [preferences, setPreferences] = useState<AppPreferences>(structuredClone(initialPreferences));
  const [signedIn, setSignedIn] = useState(false);
  const [presentationMode, setPresentationMode] = useState(presentationSessionActive);
  const [authLoading, setAuthLoading] = useState(() => Boolean(supabase));
  const [activeRoadmapDraft, setActiveRoadmapDraft] = useState<RoadmapDraft | null>(null);
  const [activeProofUri, setActiveProofUri] = useState<string | null>(null);
  const [completionState, setCompletionState] = useState<AsyncActionState>('idle');
  const [completionReceipt, setCompletionReceipt] = useState<CompletionReceipt | null>(null);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [chestState, setChestState] = useState<AsyncActionState>('idle');
  const [chestReceipt, setChestReceipt] = useState<ChestReceipt | null>(null);
  const completionMutation = useRef(0);
  const preferencesLoaded = useRef(false);
  const accountHydrationVersion = useRef(0);
  const activeApi = presentationMode ? mockApi : odysseyApi;

  const resetAccountData = useCallback(() => {
    setProfile(usingSupabaseData ? emptyProfile : structuredClone(initialProfile));
    setGoals(usingSupabaseData ? [] : structuredClone(initialGoals));
    setQuests(usingSupabaseData ? [] : structuredClone(initialQuests));
    setRewards(usingSupabaseData ? emptyRewards : structuredClone(initialRewards));
    setRewardLedger(usingSupabaseData ? [] : structuredClone(initialRewardLedger));
    setNotifications(usingSupabaseData ? [] : structuredClone(initialNotifications));
  }, []);

  const hydrateAccountData = useCallback(async (version: number) => {
    const [profileResult, goalsResult, questsResult, rewardsResult, ledgerResult, notificationsResult, preferencesResult] = await Promise.all([
      odysseyApi.profile.get(), odysseyApi.goals.list(), odysseyApi.quests.list(), odysseyApi.rewards.get(), odysseyApi.rewards.ledger(), odysseyApi.notifications.list(), odysseyApi.notifications.getReminderPreferences(),
    ]);
    if (version !== accountHydrationVersion.current) return false;
    if (!profileResult.ok || !goalsResult.ok || !questsResult.ok || !rewardsResult.ok || !ledgerResult.ok || !notificationsResult.ok || !preferencesResult.ok) return false;
    setProfile(profileResult.data);
    setGoals(goalsResult.data);
    setQuests(questsResult.data);
    setRewards(rewardsResult.data);
    setRewardLedger(ledgerResult.data);
    setNotifications(notificationsResult.data);
    setPreferences((current) => ({ ...current, ...preferencesResult.data }));
    return true;
  }, []);

  const applyAuthSession = useCallback((session: Awaited<ReturnType<NonNullable<typeof supabase>['auth']['getSession']>>['data']['session']) => {
    const version = ++accountHydrationVersion.current;
    setSignedIn(Boolean(session?.user));
    if (session?.user) {
      setPresentationSession(false);
      setPresentationMode(false);
      setProfile(userProfile(session.user));
      // Auth callbacks must return promptly. Defer profile/data hydration so it
      // cannot block Supabase's session event or protected-route transition.
      setTimeout(() => { void hydrateAccountData(version); }, 0);
    } else {
      resetAccountData();
    }
    setAuthLoading(false);
  }, [hydrateAccountData, resetAccountData]);

  useEffect(() => {
    if (usingSupabaseData) {
      preferencesLoaded.current = true;
      return;
    }
    AsyncStorage.getItem(PREFERENCES_KEY)
      .then((stored) => {
        if (stored) setPreferences({ ...initialPreferences, ...JSON.parse(stored) });
      })
      .catch(() => undefined)
      .finally(() => {
        preferencesLoaded.current = true;
      });
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    let mounted = true;
    const setSession = (session: Awaited<ReturnType<typeof client.auth.getSession>>['data']['session']) => {
      if (mounted) applyAuthSession(session);
    };

    client.auth.getSession().then(({ data }) => setSession(data.session)).catch(() => setSession(null));
    const { data: subscription } = client.auth.onAuthStateChange((_event, session) => setSession(session));
    const appStateSubscription = Platform.OS === 'web'
      ? undefined
      : AppState.addEventListener('change', (state) => {
          if (state === 'active') client.auth.startAutoRefresh();
          else client.auth.stopAutoRefresh();
        });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
      appStateSubscription?.remove();
    };
  }, [applyAuthSession]);

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
    if (!supabase) return SUPABASE_CONFIGURATION_ERROR;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error || !data.session) return authError(error?.message ?? 'Odyssey could not start a session for those credentials.');
      applyAuthSession(data.session);
      return null;
    } catch (error) {
      return authError(error instanceof Error ? error.message : undefined);
    }
  }, [applyAuthSession]);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    if (!supabase) return { error: SUPABASE_CONFIGURATION_ERROR, confirmationRequired: false };
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { name: name.trim() }, emailRedirectTo: Linking.createURL('auth/callback') },
      });
      if (!error && data.session) applyAuthSession(data.session);
      return { error: error ? authError(error.message) : null, confirmationRequired: !error && !data.session };
    } catch (error) {
      return { error: authError(error instanceof Error ? error.message : undefined), confirmationRequired: false };
    }
  }, [applyAuthSession]);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) return SUPABASE_CONFIGURATION_ERROR;
    try {
      const redirectTo = Linking.createURL('auth/callback');
      const { data: oauthData, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error || !oauthData.url) return authError(error?.message);

      const result = await WebBrowser.openAuthSessionAsync(oauthData.url, redirectTo);
      if (result.type !== 'success') {
        return result.type === 'cancel' || result.type === 'dismiss'
          ? 'Google sign-in was cancelled.'
          : 'Google sign-in did not complete. Please try again.';
      }

      const callback = new URL(result.url);
      const code = callback.searchParams.get('code');
      if (code) {
        const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError || !exchangeData.session) return authError(exchangeError?.message ?? 'Google did not return an Odyssey session.');
        applyAuthSession(exchangeData.session);
        return null;
      }

      const tokens = new URLSearchParams(callback.hash.replace(/^#/, ''));
      const accessToken = tokens.get('access_token');
      const refreshToken = tokens.get('refresh_token');
      if (!accessToken || !refreshToken) return 'Google did not return a valid Odyssey session.';
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      if (sessionError || !sessionData.session) return authError(sessionError?.message ?? 'Google did not return an Odyssey session.');
      applyAuthSession(sessionData.session);
      return null;
    } catch (error) {
      return authError(error instanceof Error ? error.message : undefined);
    }
  }, [applyAuthSession]);

  const syncAuthSession = useCallback(async () => {
    if (!supabase) return SUPABASE_CONFIGURATION_ERROR;
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) return authError(error?.message ?? 'Your sign-in link did not create a usable session.');
      applyAuthSession(data.session);
      return null;
    } catch (error) {
      return authError(error instanceof Error ? error.message : undefined);
    }
  }, [applyAuthSession]);

  const enterPresentationMode = useCallback(() => {
    setPresentationSession(true);
    setPresentationMode(true);
    setProfile(structuredClone(initialProfile));
    setGoals(structuredClone(initialGoals));
    setQuests(structuredClone(initialQuests));
    setRewards(structuredClone(initialRewards));
    setRewardLedger(structuredClone(initialRewardLedger));
    setNotifications(structuredClone(initialNotifications));
    setPreferences(structuredClone(initialPreferences));
  }, []);

  const signOut = useCallback(async () => {
    ++accountHydrationVersion.current;
    try {
      // A local sign-out clears this device immediately and does not leave the
      // traveler trapped in the app when a remote network request is unavailable.
      if (supabase) await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // Local application cleanup below is still required when Supabase cannot respond.
    } finally {
      setSignedIn(false);
      setPresentationSession(false);
      setPresentationMode(false);
      resetAccountData();
      setActiveRoadmapDraft(null);
      setActiveProofUri(null);
    }
  }, [resetAccountData]);

  const generateRoadmap = useCallback(async (input: Omit<RoadmapDraft, 'levels'>) => {
    const result = await activeApi.roadmaps.generate(input);
    if (!result.ok) return result.error.message;
    setActiveRoadmapDraft(result.data);
    return null;
  }, [activeApi]);

  const updateRoadmapLevel = useCallback((levelId: string, input: Partial<RoadmapLevel>) => {
    setActiveRoadmapDraft((draft) =>
      draft
        ? { ...draft, levels: draft.levels.map((level) => (level.id === levelId ? { ...level, ...input } : level)) }
        : draft,
    );
  }, []);

  const regenerateRoadmapLevel = useCallback(async (levelId: string) => {
    const draft = activeRoadmapDraft;
    const target = draft?.levels.find((level) => level.id === levelId);
    if (!draft || !target) return 'This proposal is no longer available. Return to the goal form and generate a new route.';

    const requestConstraints = [
      draft.constraints,
      `Regeneration request: improve level ${target.number} while keeping the whole ten-level route coherent.`,
      `Replace the selected level with a more practical alternative to: ${JSON.stringify({ title: target.title, purpose: target.purpose, milestone: target.milestone, habits: target.habits, tasks: target.tasks })}`,
    ].filter(Boolean).join('\n\n');
    const result = await activeApi.roadmaps.generate({
      goalTitle: draft.goalTitle,
      deadline: draft.deadline,
      startingPoint: draft.startingPoint,
      availableDays: draft.availableDays,
      minutesPerDay: draft.minutesPerDay,
      preferredIntensity: draft.preferredIntensity,
      constraints: requestConstraints,
    });
    if (!result.ok) return result.error.message;

    const replacement = result.data.levels.find((level) => level.number === target.number);
    if (!replacement) return 'The planning service returned an incomplete replacement. Your current level has not changed.';
    setActiveRoadmapDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        levels: current.levels.map((level) => level.id === levelId
          ? { ...replacement, id: level.id, number: level.number, status: level.status }
          : level),
      };
    });
    return null;
  }, [activeApi, activeRoadmapDraft]);

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
    if (!activeRoadmapDraft) return { goal: null, error: 'There is no roadmap proposal to activate.' };
    const result = await activeApi.roadmaps.accept(activeRoadmapDraft);
    if (!result.ok) return { goal: null, error: result.error.message };
    setGoals((current) => [result.data, ...current.filter((goal) => goal.id !== result.data.id)]);
    setActiveRoadmapDraft(null);
    await haptic('success');
    return { goal: result.data, error: null };
  }, [activeApi, activeRoadmapDraft, haptic]);

  const updateGoal = useCallback(async (goalId: string, input: Partial<Goal>) => {
    const result = await activeApi.goals.update(goalId, input);
    if (!result.ok) return result.error.message;
    setGoals((current) => current.map((goal) => (goal.id === goalId ? result.data : goal)));
    return null;
  }, [activeApi]);

  const completeGoal = useCallback(async (goalId: string) => {
    const goal = goals.find((item) => item.id === goalId);
    if (!goal || goal.currentLevel < 10 || goal.bossHealth > 0) return 'The final level and boss must be completed before this Odyssey can close.';
    const completedAt = new Date().toISOString();
    const result = await activeApi.goals.update(goalId, { status: 'completed', progress: 100, completedAt });
    if (!result.ok) return result.error.message;
    setGoals((current) => current.map((item) => item.id === goalId ? result.data : item));
    await haptic('success');
    return null;
  }, [activeApi, goals, haptic]);

  const createQuest = useCallback(async (input: NewQuestInput) => {
    const result = await activeApi.quests.create({
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
  }, [activeApi, haptic]);

  const updateQuest = useCallback(async (questId: string, input: Partial<Quest>) => {
    const result = await activeApi.quests.update(questId, input);
    if (!result.ok) return result.error.message;
    setQuests((current) => current.map((quest) => (quest.id === questId ? result.data : quest)));
    return null;
  }, [activeApi]);

  const updateQuestSeries = useCallback(async (questId: string, input: Partial<Quest>) => {
    const source = quests.find((quest) => quest.id === questId);
    if (!source?.seriesId) return updateQuest(questId, input);
    const editable = quests.filter((quest) => quest.seriesId === source.seriesId && quest.status !== 'completed' && quest.status !== 'missed');
    const results = await Promise.all(editable.map((quest) => activeApi.quests.update(quest.id, input)));
    const failure = results.find((result) => !result.ok);
    if (failure && !failure.ok) return failure.error.message;
    const updated = new Map(results.filter((result) => result.ok).map((result) => [result.data.id, result.data]));
    setQuests((current) => current.map((quest) => updated.get(quest.id) ?? quest));
    return null;
  }, [activeApi, quests, updateQuest]);

  const removeQuest = useCallback(async (questId: string) => {
    const result = await activeApi.quests.remove(questId);
    if (!result.ok) return result.error.message;
    setQuests((current) => current.filter((quest) => quest.id !== questId));
    return null;
  }, [activeApi]);

  const completeQuest = useCallback(
    async (questId: string, actualIntensity: Intensity, proofUri?: string) => {
      const mutation = ++completionMutation.current;
      setCompletionState('pending');
      setCompletionReceipt(null);
      setCompletionError(null);
      setQuests((current) =>
        current.map((quest) => (quest.id === questId ? { ...quest, status: 'completionPending' } : quest)),
      );
      const result = await activeApi.quests.complete(questId, {
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
    [activeApi, haptic],
  );

  const resetCompletion = useCallback(() => {
    completionMutation.current += 1;
    setCompletionState('idle');
    setCompletionReceipt(null);
    setCompletionError(null);
  }, []);

  const markNotificationRead = useCallback(async (notificationId: string) => {
    const result = await activeApi.notifications.markRead(notificationId);
    if (result.ok) {
      setNotifications((current) => current.map((item) => (item.id === notificationId ? result.data : item)));
    }
  }, [activeApi]);

  const updatePreferences = useCallback(async (input: Partial<AppPreferences>) => {
    const next = { ...preferences, ...input };
    setPreferences(next);
    if (!usingSupabaseData && preferencesLoaded.current) await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(next));
    const result = await activeApi.profile.updatePreferences(next);
    if (result.ok) setPreferences((current) => ({ ...current, ...result.data }));
  }, [activeApi, preferences]);

  const selectCosmetic = useCallback(async (cosmeticId: string) => {
    const cosmetic = rewards.cosmetics.find((item) => item.id === cosmeticId);
    const result = await activeApi.rewards.selectCosmetic(cosmeticId);
    if (!result.ok) return;
    setRewards(result.data);
    if (cosmetic?.unlocked) setProfile((current) => ({ ...current, selectedCosmetic: cosmetic.name }));
  }, [activeApi, rewards.cosmetics]);

  const openChest = useCallback(async (chestId: string) => {
    setChestState('pending');
    setChestReceipt(null);
    const result = await activeApi.rewards.openChest(chestId);
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
  }, [activeApi, haptic]);

  const applyBoost = useCallback(async (boostId: string) => {
    const result = await activeApi.rewards.applyBoost(boostId);
    if (!result.ok) return result.error.message;
    const boost = rewards.boosts.find((item) => item.id === boostId);
    setRewards(result.data);
    setRewardLedger((current) => [{ id: `ledger-${Date.now()}`, createdAt: new Date().toISOString(), kind: 'boost', title: `${boost?.name ?? 'Boost'} prepared`, xp: 0, rubies: 0 }, ...current]);
    await haptic('success');
    return null;
  }, [activeApi, haptic, rewards.boosts]);

  const unlockCosmetic = useCallback(async (cosmeticId: string) => {
    const cosmetic = rewards.cosmetics.find((item) => item.id === cosmeticId);
    const result = await activeApi.rewards.unlockCosmetic(cosmeticId);
    if (!result.ok) return result.error.message;
    setRewards(result.data);
    setRewardLedger((current) => [{ id: `ledger-${Date.now()}`, createdAt: new Date().toISOString(), kind: 'cosmetic', title: `${cosmetic?.name ?? 'Cosmetic'} unlocked`, xp: 0, rubies: -(cosmetic?.rubyPrice ?? 0) }, ...current]);
    await haptic('success');
    return null;
  }, [activeApi, haptic, rewards.cosmetics]);

  const useStreakProtection = useCallback(async (questId?: string) => {
    const quest = quests.find((item) => item.id === questId);
    const result = await activeApi.rewards.useStreakProtection(questId);
    if (!result.ok) return result.error.message;
    setRewards(result.data);
    if (questId) setQuests((current) => current.map((item) => item.id === questId ? { ...item, streakProtected: true } : item));
    setRewardLedger((current) => [{ id: `ledger-${Date.now()}`, createdAt: new Date().toISOString(), kind: 'streakProtection', title: quest ? `Streak protected after ${quest.title}` : 'Streak protection reserved for the next eligible miss', xp: 0, rubies: 0 }, ...current]);
    await haptic('success');
    return null;
  }, [activeApi, haptic, quests]);

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
      presentationMode,
      authLoading,
      activeRoadmapDraft,
      activeProofUri,
      completionState,
      completionReceipt,
      completionError,
      chestState,
      chestReceipt,
      signIn,
      signUp,
      signInWithGoogle,
      enterPresentationMode,
      signOut,
      syncAuthSession,
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
      presentationMode,
      authLoading,
      activeRoadmapDraft,
      activeProofUri,
      completionState,
      completionReceipt,
      completionError,
      chestState,
      chestReceipt,
      signIn,
      signUp,
      signInWithGoogle,
      enterPresentationMode,
      signOut,
      syncAuthSession,
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
