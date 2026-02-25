import { parseAuthUser } from '@/lib/zod/schema';
import type { AuthUser, SessionUser } from '@/lib/types';

export const parseSessionUser = (sessionUser?: SessionUser | null): AuthUser | null => {
  if (!sessionUser) {
    return null;
  }

  try {
    return parseAuthUser({
      uid: sessionUser.id,
      email: sessionUser.email,
      displayName: sessionUser.name,
      emailVerified: sessionUser.emailVerified,
    });
  } catch {
    return null;
  }
};
