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
