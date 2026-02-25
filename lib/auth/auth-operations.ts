import { authClient } from '@/lib/auth/auth-client';
import type { SignInInput, SignUpInput } from '@/lib/types';
import { parseSignInInput, parseSignUpInput } from '@/lib/zod/schema';
import { throwIfAuthClientError, mapAuthError } from './errors';

const runEmailAuth = async (
  mode: 'signIn' | 'signUp',
  input: SignInInput | SignUpInput,
) => {
  try {
    if (mode === 'signIn') {
      const payload = parseSignInInput(input);
      const { error } = await authClient.signIn.email({
        email: payload.email,
        password: payload.password,
        callbackURL: '/dashboard',
      });
      throwIfAuthClientError(error);
      return;
    }

    const payload = parseSignUpInput(input);
    const { error } = await authClient.signUp.email({
      email: payload.email,
      password: payload.password,
      name: payload.name,
      callbackURL: '/dashboard',
    });
    throwIfAuthClientError(error);
  } catch (error) {
    throw mapAuthError(error);
  }
};


export const emailSignIn = async (input: SignInInput): Promise<void> => {
  await runEmailAuth('signIn', input);
};

export const emailSignUp = async (input: SignUpInput): Promise<void> => {
  await runEmailAuth('signUp', input);
};

export const logOut = async (): Promise<string> => {
  await authClient.signOut();
  return '/';
};
