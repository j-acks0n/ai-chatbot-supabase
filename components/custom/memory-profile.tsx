'use client';

import { Heart, Clock, AlertCircle, Calendar, User } from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="max-w-2xl mx-auto px-6 py-16 space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 animate-pulse">
              <Heart className="w-8 h-8 text-purple-400" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-6 bg-gray-200 rounded-lg w-32 mx-auto animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-48 mx-auto animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-2xl mx-auto px-6 py-16 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg">
            <Heart className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              {profile.name}
            </h1>
            <p className="text-lg text-gray-600">
              Connect with your cherished memories through meaningful
              conversation
            </p>
          </div>
        </div>

        {/* Session Card */}
        <Card className="border-0 shadow-xl ring-1 ring-gray-200/50 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 self-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-semibold text-gray-900">
                Memory Session
              </CardTitle>
              <CardDescription className="text-gray-600">
                Each conversation lasts 10 minutes • One session per month
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pb-8">
            {!canStartSession ? (
              // Monthly limit reached
              <div className="text-center space-y-6">
                <div className="rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-6">
                  <div className="flex items-center justify-center space-x-3 text-orange-800 mb-3">
                    <AlertCircle className="w-6 h-6" />
                    <span className="font-semibold text-lg">
                      Monthly limit reached
                    </span>
                  </div>
                  <p className="text-orange-700 mb-2">
                    You&apos;ve used your session for this month.
                  </p>
                  {nextAvailableDate && (
                    <div className="flex items-center justify-center space-x-2 text-orange-600 mt-4">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Next available:{' '}
                        {formatNextAvailableDate(nextAvailableDate)}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                  Sessions are limited to promote healthy engagement with
                  memories. Take time to reflect and return next month for
                  another meaningful conversation.
                </p>
              </div>
            ) : activeSession ? (
              // Active session exists
              <div className="text-center space-y-6">
                <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6">
                  <div className="flex items-center justify-center space-x-3 text-green-800 mb-3">
                    <Clock className="w-6 h-6" />
                    <span className="font-semibold text-lg">
                      Session in progress
                    </span>
                  </div>
                  <p className="text-green-700">
                    You have an active session that you can continue.
                  </p>
                </div>
                <Button
                  onClick={continueActiveSession}
                  className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                  size="lg"
                >
                  Continue Session
                </Button>
              </div>
            ) : (
              // Can start new session
              <div className="text-center space-y-6">
                <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6">
                  <div className="flex items-center justify-center space-x-3 text-purple-800 mb-3">
                    <Heart className="w-6 h-6" />
                    <span className="font-semibold text-lg">
                      Ready to connect
                    </span>
                  </div>
                  <p className="text-purple-700 mb-3">
                    Start your 10-minute session to connect with {profile.name}
                    &apos;s memory.
                  </p>
                  <div className="flex items-center justify-center space-x-2 text-purple-600">
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Personalized conversation based on their communication
                      style
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  <Button
                    onClick={startTimedSession}
                    disabled={isStartingSession}
                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                    size="lg"
                  >
                    {isStartingSession ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Starting Session...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>Start 10-Minute Session</span>
                      </div>
                    )}
                  </Button>
                  <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                    Sessions automatically end after 10 minutes to encourage
                    healthy reflection. Your conversation will be private and
                    secure.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
