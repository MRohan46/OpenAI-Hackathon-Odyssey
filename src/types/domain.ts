export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type Intensity = 'light' | 'normal' | 'intense';
export type QuestKind = 'habit' | 'task';
export type QuestStatus =
  | 'scheduled'
  | 'inProgress'
  | 'completionPending'
  | 'completed'
  | 'upcoming'
  | 'overdue'
  | 'missed';
export type ProofPolicy = 'required' | 'optional' | 'none';

export interface UserProfile {
  id: string;
  name: string;
  handle: string;
  accountLevel: number;
  xp: number;
  xpToNextLevel: number;
  overallStreak: number;
  avatarSeed: string;
  selectedCosmetic: string;
}

export interface Quest {
  id: string;
  goalId: string;
  title: string;
  description: string;
  kind: QuestKind;
  status: QuestStatus;
  scheduledAt: string;
  deadlineAt?: string;
  durationMinutes: number;
  priority: Priority;
  plannedIntensity: Intensity;
  actualIntensity?: Intensity;
  recurrence?: string;
  proofPolicy: ProofPolicy;
  proofUri?: string;
  rewardXp: number;
  rewardRubies: number;
  bossDamage: number;
  completedAt?: string;
}

export interface RoadmapLevel {
  id: string;
  number: number;
  title: string;
  purpose: string;
  status: 'locked' | 'active' | 'completed';
  milestone: string;
  bossType: 'none' | 'mini' | 'final';
  bossName?: string;
  bossHealth?: number;
  habits: string[];
  tasks: string[];
}

export interface Goal {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  deadline: string;
  currentLevel: number;
  progress: number;
  accent: string;
  status: 'active' | 'completed' | 'draft';
  bossName: string;
  bossHealth: number;
  roadmap: RoadmapLevel[];
}

export interface RewardInventory {
  rubies: number;
  unopenedChests: number;
  boosts: {
    id: string;
    name: string;
    description: string;
    quantity: number;
  }[];
  cosmetics: {
    id: string;
    name: string;
    description: string;
    unlocked: boolean;
    selected: boolean;
  }[];
  streakProtection: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  kind: 'scheduled' | 'deadline' | 'overdue' | 'reward';
}

export interface HabitAnalytics {
  habitId: string;
  currentStreak: number;
  longestStreak: number;
  scheduled: number;
  completed: number;
  missed: number;
  intensity: Record<Intensity, number>;
  weekly: { day: string; planned: number; actual: number }[];
}

export interface GoalAnalytics {
  goalId: string;
  roadmapProgress: number;
  completedStages: number;
  connectedQuestCompletion: number;
  bossHealth: number;
  deadlineProgress: number;
}

export interface OverallAnalytics {
  period: 'week' | 'month';
  questsCompleted: number;
  completionRate: number;
  consistency: number;
  xpEarned: number;
  rubiesEarned: number;
  intensity: Record<Intensity, number>;
  daily: { label: string; value: number }[];
}

export interface AppPreferences {
  reducedMotionOverride: 'system' | 'on' | 'off';
  haptics: boolean;
  highContrast: boolean;
  graphicsQuality: 'auto' | 'full' | 'balanced' | 'calm';
  questReminders: boolean;
  deadlineReminders: boolean;
  overdueReminders: boolean;
  reminderLeadMinutes: number;
}

export interface RoadmapDraft {
  goalTitle: string;
  deadline: string;
  startingPoint: string;
  availableDays: string[];
  minutesPerDay: number;
  preferredIntensity: Intensity;
  constraints: string;
  levels: RoadmapLevel[];
}
