import type {
  AppPreferences,
  Goal,
  GoalAnalytics,
  HabitAnalytics,
  NotificationItem,
  OverallAnalytics,
  Quest,
  RewardInventory,
  RoadmapDraft,
  UserProfile,
} from '../types/domain';

export type ApiResult<T> =
  | { ok: true; data: T; requestId: string }
  | { ok: false; error: ApiError; requestId: string };

export interface ApiError {
  code: 'offline' | 'validation' | 'unauthorized' | 'not_found' | 'conflict' | 'server';
  message: string;
  retryable: boolean;
}

export interface Session {
  accessToken: string;
  user: UserProfile;
}

export interface CompletionInput {
  actualIntensity: Quest['plannedIntensity'];
  proofUri?: string;
  clientMutationId: string;
}

export interface CompletionReceipt {
  quest: Quest;
  rewards: Pick<RewardInventory, 'rubies'> & { xp: number };
  bossHealth: number;
}

export interface ChestReceipt {
  chestId: string;
  xp: number;
  rubies: number;
  cosmetic?: string;
}

export interface ProofUploadInput {
  fileName: string;
  contentType: 'image/jpeg' | 'image/png' | 'image/heic';
  byteLength?: number;
}

export interface ProofUploadTarget {
  uploadUrl: string;
  objectKey: string;
  headers: Record<string, string>;
  expiresAt: string;
}

export interface ProofAttachmentInput {
  completionId: string;
  objectKey: string;
  capturedAt: string;
}

export interface ProofAttachment extends ProofAttachmentInput {
  id: string;
}

export interface PrivateProofUrl {
  proofId: string;
  url: string;
  expiresAt: string;
}

export type ReminderPreferences = Pick<
  AppPreferences,
  'questReminders' | 'deadlineReminders' | 'overdueReminders' | 'reminderLeadMinutes'
>;

export interface OdysseyApi {
  auth: {
    signIn(email: string, password: string): Promise<ApiResult<Session>>;
    signUp(name: string, email: string, password: string): Promise<ApiResult<Session>>;
    signOut(): Promise<ApiResult<null>>;
  };
  profile: {
    get(): Promise<ApiResult<UserProfile>>;
    updatePreferences(input: AppPreferences): Promise<ApiResult<AppPreferences>>;
  };
  goals: {
    list(): Promise<ApiResult<Goal[]>>;
    get(goalId: string): Promise<ApiResult<Goal>>;
    create(input: RoadmapDraft): Promise<ApiResult<Goal>>;
    update(goalId: string, input: Partial<Goal>): Promise<ApiResult<Goal>>;
  };
  roadmaps: {
    generate(input: Omit<RoadmapDraft, 'levels'>): Promise<ApiResult<RoadmapDraft>>;
    accept(input: RoadmapDraft): Promise<ApiResult<Goal>>;
  };
  quests: {
    list(): Promise<ApiResult<Quest[]>>;
    get(questId: string): Promise<ApiResult<Quest>>;
    create(input: Omit<Quest, 'id'>): Promise<ApiResult<Quest>>;
    update(questId: string, input: Partial<Quest>): Promise<ApiResult<Quest>>;
    remove(questId: string): Promise<ApiResult<null>>;
    complete(questId: string, input: CompletionInput): Promise<ApiResult<CompletionReceipt>>;
  };
  proof: {
    requestUploadTarget(input: ProofUploadInput): Promise<ApiResult<ProofUploadTarget>>;
    attach(input: ProofAttachmentInput): Promise<ApiResult<ProofAttachment>>;
    getPrivateUrl(proofId: string): Promise<ApiResult<PrivateProofUrl>>;
  };
  rewards: {
    get(): Promise<ApiResult<RewardInventory>>;
    openChest(chestId: string): Promise<ApiResult<ChestReceipt>>;
    applyBoost(boostId: string): Promise<ApiResult<RewardInventory>>;
    selectCosmetic(cosmeticId: string): Promise<ApiResult<RewardInventory>>;
    unlockCosmetic(cosmeticId: string): Promise<ApiResult<RewardInventory>>;
    useStreakProtection(questId?: string): Promise<ApiResult<RewardInventory>>;
  };
  analytics: {
    overall(period: OverallAnalytics['period']): Promise<ApiResult<OverallAnalytics>>;
    habit(habitId: string): Promise<ApiResult<HabitAnalytics>>;
    goal(goalId: string): Promise<ApiResult<GoalAnalytics>>;
  };
  notifications: {
    list(): Promise<ApiResult<NotificationItem[]>>;
    markRead(notificationId: string): Promise<ApiResult<NotificationItem>>;
    getReminderPreferences(): Promise<ApiResult<ReminderPreferences>>;
    updateReminderPreferences(input: ReminderPreferences): Promise<ApiResult<ReminderPreferences>>;
  };
}
