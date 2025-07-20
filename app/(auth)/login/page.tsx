'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signIn } from '@/db/auth';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

      await signIn(email, password);
      router.push('/');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] items-center justify-center py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-4 text-center">
          <div className="flex items-center justify-center space-x-2 text-2xl font-bold text-purple-600">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span>InLovingMemory</span>
          </div>
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Sign in to continue your conversations with your loved ones
          </p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              placeholder="your@email.com"
              required
              type="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" required type="password" />
          </div>
          <Button
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
        <div className="text-center text-sm">
          Don&apos;t have an account?{' '}
          <Link
            className="underline text-purple-600 hover:text-purple-700"
            href="/register"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
