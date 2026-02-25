'use client';
import { createContext, useContext, useMemo } from 'react';
import { authClient } from '@/lib/auth/auth-client';
import type { AuthUser, AuthContextType } from '@/lib/types';
import {
  emailSignIn,
  emailSignUp,
  logOut as logOutOperation,
} from '@/lib/auth/auth-operations';
import { parseSessionUser } from '@/lib/auth/session';
import { assertAuthContext } from '@/lib/auth/errors';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  assertAuthContext(context);
  return context;
};

export const useAuthLogic = (): AuthContextType => {
  const { data: session, isPending } = authClient.useSession();

  const user: AuthUser | null = useMemo(
    () => parseSessionUser(session?.user),
    [session?.user],
  );

  const loading = isPending;

  const logOut = async () => {
    const redirectPath = await logOutOperation();
    window.location.href = redirectPath;
  };

  return { user, loading, logOut, emailSignIn, emailSignUp };
};