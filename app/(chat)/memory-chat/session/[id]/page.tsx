import { redirect } from 'next/navigation';

import { TimedMemoryChat } from '@/components/custom/timed-memory-chat';
import {
  getActiveMemorySessionQuery,
  getTrainingMessagesQuery,
} from '@/db/queries';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TimedMemoryChatPage({ params }: PageProps) {
  const { id: sessionId } = await params;
  const supabase = await createClient();

  try {
    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('memory_sessions')
      .select(
        `
        *,
        memory_profiles!inner(*)
      `
      )
      .eq('id', sessionId)
      .eq('is_active', true)
      .single();

    if (sessionError || !session) {
      redirect('/');
    }

    // Check if session is expired (more than 10 minutes old)
    const sessionStart = new Date(session.session_start);
    const now = new Date();
    const minutesElapsed =
      (now.getTime() - sessionStart.getTime()) / (1000 * 60);

    if (minutesElapsed >= 10) {
      // Session expired, close it and redirect
      await supabase
        .from('memory_sessions')
        .update({
          is_active: false,
          session_end: new Date(
            sessionStart.getTime() + 10 * 60 * 1000
          ).toISOString(),
        })
        .eq('id', sessionId);

      redirect(`/memories/${session.memory_profile_id}`);
    }

    // Get training messages for context
    const trainingMessages = await getTrainingMessagesQuery(
      supabase,
      session.memory_profiles.id
    );

    return (
      <TimedMemoryChat session={session} trainingMessages={trainingMessages} />
    );
  } catch (error) {
    console.error('Error loading timed memory session:', error);
    redirect('/');
  }
}
