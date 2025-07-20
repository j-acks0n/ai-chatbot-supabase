import { redirect } from 'next/navigation';

import { MemoryChat } from '@/components/custom/memory-chat';
import {
  getMemoryConversationWithMessagesQuery,
  getTrainingMessagesQuery,
} from '@/db/queries';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MemoryChatPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  try {
    const conversation = await getMemoryConversationWithMessagesQuery(
      supabase,
      id
    );

    if (!conversation) {
      redirect('/');
    }

    // Get training messages for context
    const trainingMessages = await getTrainingMessagesQuery(
      supabase,
      conversation.memory_profiles.id
    );

    return (
      <MemoryChat
        conversation={conversation}
        trainingMessages={trainingMessages}
      />
    );
  } catch (error) {
    console.error('Error loading memory conversation:', error);
    redirect('/');
  }
}
