import { ZodError } from 'zod';
import { getZodErrorMessage } from '@/lib/zod/schema';

export const AUTH_ERRORS = {
  AUTH_FAILED: 'Authentication failed',
  USE_AUTH_OUTSIDE_PROVIDER: 'useAuth must be used within an AuthContext.Provider',
} as const;

export class AuthClientError extends Error {
  constructor(message: string = AUTH_ERRORS.AUTH_FAILED) {
    super(message);
    this.name = 'AuthClientError';
  }
}

export const throwIfAuthClientError = (
  error: { message?: string } | null,
): void => {
  if (error) {
    throw new AuthClientError(error.message ?? AUTH_ERRORS.AUTH_FAILED);
  }
};

export const mapAuthError = (error: unknown): Error => {
  if (error instanceof ZodError) {
    return new Error(getZodErrorMessage(error));
  }

  if (error instanceof Error) {
    return error;
  }

  return new AuthClientError();
};

export function assertAuthContext<T>(
  context: T | undefined,
  message: string = AUTH_ERRORS.USE_AUTH_OUTSIDE_PROVIDER,
): asserts context is T {
  if (context === undefined) {
    throw new Error(message);
  }
}
