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
