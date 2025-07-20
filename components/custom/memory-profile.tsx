'use client';

import { Heart, Clock, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  createMemorySessionQuery,
  checkMonthlyLimitQuery,
  getActiveMemorySessionQuery,
} from '@/db/queries';
import { createClient } from '@/lib/supabase/client';

interface MemoryProfileProps {
  profile: {
    id: string;
    name: string;
  };
}

export function MemoryProfile({ profile }: MemoryProfileProps) {
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [canStartSession, setCanStartSession] = useState(true);
  const [nextAvailableDate, setNextAvailableDate] = useState<Date | null>(null);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUsageAndSession();
  }, []);

  const checkUsageAndSession = async () => {
    try {
      const supabase = createClient();

      // Check monthly limit
      const limitCheck = await checkMonthlyLimitQuery(supabase);
      setCanStartSession(limitCheck.canStartSession);
      setNextAvailableDate(limitCheck.nextAvailableDate || null);

      // Check for active session
      if (limitCheck.canStartSession) {
        const activeSession = await getActiveMemorySessionQuery(
          supabase,
          profile.id
        );
        setActiveSession(activeSession);
      }
    } catch (error) {
      console.error('Error checking usage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startTimedSession = async () => {
    setIsStartingSession(true);
    try {
      const supabase = createClient();
      const session = await createMemorySessionQuery(supabase, profile.id);

      // Navigate to a special timed chat interface
      router.push(`/memory-chat/session/${session.id}`);
    } catch (error) {
      console.error('Error starting session:', error);
      if (error instanceof Error) {
        alert(error.message);
      }
      await checkUsageAndSession(); // Refresh the state
    } finally {
      setIsStartingSession(false);
    }
  };

  const continueActiveSession = () => {
    if (activeSession) {
      router.push(`/memory-chat/session/${activeSession.id}`);
    }
  };

  const formatNextAvailableDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="text-center">
          <Heart className="size-12 mx-auto mb-4 opacity-50 animate-pulse" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2 text-2xl font-bold text-purple-600">
          <Heart className="size-8" />
          <span>InLovingMemory</span>
        </div>
        <p className="text-gray-600">Connect with your cherished memories</p>
      </div>

      {/* Session Card */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2 text-xl">
            <Clock className="size-6 text-purple-600" />
            <span>Memory Session</span>
          </CardTitle>
          <CardDescription>
            Each session lasts 10 minutes. One session per month.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!canStartSession ? (
            // Monthly limit reached
            <div className="text-center space-y-4">
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center justify-center space-x-2 text-orange-700 mb-2">
                  <AlertCircle className="size-5" />
                  <span className="font-medium">Monthly limit reached</span>
                </div>
                <p className="text-sm text-orange-600">
                  You&apos;ve used your session for this month.
                </p>
                {nextAvailableDate && (
                  <p className="text-sm text-orange-600 mt-1">
                    Next available: {formatNextAvailableDate(nextAvailableDate)}
                  </p>
                )}
              </div>
            </div>
          ) : activeSession ? (
            // Active session exists
            <div className="text-center space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-center space-x-2 text-green-700 mb-2">
                  <Clock className="size-5" />
                  <span className="font-medium">Session in progress</span>
                </div>
                <p className="text-sm text-green-600">
                  You have an active session that you can continue.
                </p>
              </div>
              <Button
                onClick={continueActiveSession}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                Continue Session
              </Button>
            </div>
          ) : (
            // Can start new session
            <div className="text-center space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-center space-x-2 text-blue-700 mb-2">
                  <Heart className="size-5" />
                  <span className="font-medium">Ready to connect</span>
                </div>
                <p className="text-sm text-blue-600">
                  Start your 10-minute session to connect with your memories.
                </p>
                <p className="text-xs text-blue-500 mt-1">
                  Sessions automatically end after 10 minutes for your
                  wellbeing.
                </p>
              </div>
              <Button
                onClick={startTimedSession}
                disabled={isStartingSession}
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                <Clock className="size-4 mr-2" />
                {isStartingSession
                  ? 'Starting Session...'
                  : 'Start 10-Minute Session'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
