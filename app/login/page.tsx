'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth/context';
import { useRouter } from 'next/navigation';
import LoadingOverlay from '@/components/LoadingOverlay';
import type { SignInInput, SignUpInput } from '@/lib/types';
import {
  getZodErrorMessage,
  parseSignInInput,
  parseSignUpInput,
} from '@/lib/zod/schema';
import { ZodError } from 'zod';

export default function LoginPage() {
  const { emailSignIn, emailSignUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    let signInPayload: SignInInput | null = null;
    let signUpPayload: SignUpInput | null = null;

    try {
      if (isSignUp) {
        signUpPayload = parseSignUpInput({ email, password, name });
      } else {
        signInPayload = parseSignInInput({ email, password });
      }
    } catch (err: unknown) {
      if (err instanceof ZodError) {
        setError(getZodErrorMessage(err));
        return;
      }
      setError('Invalid input');
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        if (!signUpPayload) throw new Error('Invalid signup data');
        await emailSignUp(signUpPayload);
      } else {
        if (!signInPayload) throw new Error('Invalid signin data');
        await emailSignIn(signInPayload);
      }
      router.push('/dashboard');
    } catch (err: unknown) {
      setIsLoading(false);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {isLoading && <LoadingOverlay />}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900 rounded-lg shadow-xl border border-slate-800 p-8"
      >
        <h2 className="text-3xl font-bold text-center mb-2 text-transparent bg-clip-text bg-linear-to-b from-white to-slate-500">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="text-center text-slate-400 mb-6">
          {isSignUp ? 'Join skillmap and start learning' : 'Login to skillmap'}
        </p>

        {error && (
          <div className="bg-red-950/30 border border-red-700 text-red-400 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-slate-300">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.currentTarget.value)}
                className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-white placeholder-slate-500"
               required
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-300">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-white placeholder-slate-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-white placeholder-slate-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors mt-6"
          >
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-900 text-slate-500">
                Or continue with
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-400">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-medium text-purple-400 hover:text-purple-300 transition-colors"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
