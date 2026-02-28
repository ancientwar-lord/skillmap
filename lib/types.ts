import type { z } from 'zod';
import type {
  authUserSchema,
  signInSchema,
  signUpSchema,
  roadmapSubTaskSchema,
  roadmapTaskResourcesSchema,
  roadmapTaskSchema,
  roadmapResponseSchema,
} from './zod/schema';

// ── Auth Types ──
export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  logOut: () => Promise<void>;
  emailSignIn: (input: SignInInput) => Promise<void>;
  emailSignUp: (input: SignUpInput) => Promise<void>;
}

export interface SessionUser {
  id: string;
  email: string | null;
  name: string | null;
  emailVerified: boolean;
}

// ── Roadmap Types (inferred from Zod) ──
export type RoadmapSubTask = z.infer<typeof roadmapSubTaskSchema>;
export type RoadmapTaskResources = z.infer<typeof roadmapTaskResourcesSchema>;
export type RoadmapTask = z.infer<typeof roadmapTaskSchema>;
export type RoadmapResponse = z.infer<typeof roadmapResponseSchema>;

export interface TestQuestion {
  id: string;
  question_no: number;
  question_text: string;
  options: { key: string; text: string }[];
  correct_answer: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  topic?: string;
}

export interface TestResultData {
  questions: TestQuestion[];
  userAnswers: Record<string, string>;
  questionTimes: Record<string, number>;
  totalTimeTaken: number;
}

export interface AIEvaluation {
  overallScore: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  questionAnalysis: {
    questionId: string;
    isCorrect: boolean;
    explanation: string;
  }[];
}

// ── Dashboard Types ──
export interface RoadmapSummary {
  id: string;
  title: string;
  description: string | null;
  isPinned: boolean;
  taskCount: number;
  subtaskCount: number;
  completedSubtasks: number;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface TodoItem {
  id: string;
  title: string;
  date: string;
  completed: boolean;
  roadmapSlug?: string;
}

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

export interface GoalItem {
  id: string;
  text: string;
  completed: boolean;
  targetDate?: string | null;
  isPinned: boolean;
  category?: string | null;
}
