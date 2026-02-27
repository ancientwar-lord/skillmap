import { z } from 'zod';

export const emailSchema = z.email().trim().toLowerCase();

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password is too long');

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(80, 'Name is too long'),
  email: emailSchema,
  password: passwordSchema,
});

export const authUserSchema = z.object({
  uid: z.string().min(1),
  email: z.email().nullable(),
  displayName: z.string().nullable(),
  emailVerified: z.boolean(),
});

export const parseSignInInput = (input: unknown) => signInSchema.parse(input);

export const parseSignUpInput = (input: unknown) => signUpSchema.parse(input);

export const parseAuthUser = (input: unknown) => authUserSchema.parse(input);

export const getZodErrorMessage = (error: z.ZodError): string => {
  return error.issues[0]?.message ?? 'Invalid input data';
};

// ── Roadmap Schemas ──

export const roadmapSubTaskSchema = z.object({
  subTaskTitle: z.string().min(1).max(500),
  ainotes: z.string().max(5000).default(''),
});

export const roadmapTaskResourcesSchema = z.object({
  youtubeLinks: z.array(z.string().url()).default([]),
  articles: z.array(z.string().url()).default([]),
  selfstudyReferences: z.array(z.string().url()).default([]),
  practiceLinks: z.array(z.string().url()).default([]),
});

export const roadmapTaskSchema = z.object({
  taskTitle: z.string().min(1).max(255),
  taskNumber: z.number().int().min(1),
  tag: z.string().max(255).default(''),
  ainotes: z.string().max(10000).default(''),
  subTasks: z.array(roadmapSubTaskSchema).min(1),
  resources: roadmapTaskResourcesSchema.optional().default({
    youtubeLinks: [],
    articles: [],
    selfstudyReferences: [],
    practiceLinks: [],
  }),
});

export const roadmapResponseSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(10000).default(''),
  tasks: z.array(roadmapTaskSchema).min(1),
});

export const createRoadmapPromptSchema = z
  .string()
  .trim()
  .min(3, 'Prompt must be at least 3 characters')
  .max(2000, 'Prompt is too long');
