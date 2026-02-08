export enum View {
  HOME = 'HOME',
  COURSES = 'COURSES',
  AI = 'AI',
  GAMES = 'GAMES',
  PROFILE = 'PROFILE',
  NEWS = 'NEWS',
  SETTINGS = 'SETTINGS',
}

export enum Grade {
  ONE = 1,
  TWO = 2,
  THREE = 3,
  FOUR = 4,
  FIVE = 5,
  SIX = 6,
}

export enum CourseType {
  POETRY_DANCE = 'POETRY_DANCE', // 诗舞
  POETRY_TEXT = 'POETRY_TEXT',   // 诗词
}

export interface Course {
  id: string;
  title: string;
  author: string;
  dynasty?: string;
  grade: Grade;
  type: CourseType;
  coverUrl: string;
  videoUrl?: string;
  lines?: string[];
  sourceBasename?: string;
  stars: number; // Difficulty 1-5
  isLocked: boolean;
}

export interface UserStats {
  totalStars: number;
  coursesCompleted: number;
  streakDays: number;
  learningMinutes: number;
  skills: {
    rhythm: number; // 韵律
    memory: number; // 记忆
    creativity: number; // 创意
    expression: number; // 表现
    history: number; // 历史
  };
  weeklyActivity: { day: string; minutes: number }[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface NewsItem {
  id: string;
  title: string;
  date: string;
  type: 'EVENT' | 'NOTICE' | 'RESOURCE';
  summary: string;
}

export type UserId = string;

export interface UserAccount {
  id: UserId;
  username: string;
  displayName: string;
  grade: Grade;
  createdAt: number;
  lastLoginAt: number;
}

export interface UserSettings {
  lang: 'zh' | 'en';
  displayName: string;
  grade: Grade;
}

export type ProgressEventType =
  | 'course_complete'
  | 'game_dance_complete'
  | 'game_pk_complete'
  | 'game_riddle_complete'
  | 'ai_plan_generate';

export interface ProgressEvent {
  id: string;
  type: ProgressEventType;
  ts: number;
  minutes?: number;
  stars?: number;
  payload?: Record<string, unknown>;
}

export interface LearningPlanItem {
  id: string;
  text: string;
  done: boolean;
}

export interface LearningPlan {
  id: string;
  createdAt: number;
  title: string;
  tips: string[];
  items: LearningPlanItem[];
}
