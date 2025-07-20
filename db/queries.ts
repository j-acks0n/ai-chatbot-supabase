import { AuthError, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../lib/supabase/types';

type Tables = Database['public']['Tables'];
type Client = SupabaseClient<Database>;

export async function getSessionQuery(client: Client) {
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error) {
    throw {
      message: error.message,
      status: error.status || 500,
    } as AuthError;
  }

  return user;
}

export async function getUserByIdQuery(client: Client, id: string) {
  const { data: user, error } = await client
    .from('users')
    .select()
    .eq('id', id)
    .single();

  if (error) {
    throw {
      message: error.message,
      status: error?.code ? 400 : 500,
    } as AuthError;
  }

  return user;
}

export async function getUserQuery(client: Client, email: string) {
  const { data: users, error } = await client
    .from('users')
    .select()
    .eq('email', email)
    .single();

  if (error) throw error;
  return users;
}

export async function saveChatQuery(
  client: Client,
  {
    id,
    userId,
    title,
  }: {
    id: string;
    userId: string;
    title: string;
  }
) {
  const { error } = await client.from('chats').insert({
    id,
    user_id: userId,
    title,
  });

  if (error) throw error;
}

export async function getChatsByUserIdQuery(
  client: Client,
  { id }: { id: string }
) {
  const { data: chats, error } = await client
    .from('chats')
    .select()
    .eq('user_id', id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return chats;
}

export async function getChatByIdQuery(client: Client, { id }: { id: string }) {
  const { data: chat, error } = await client
    .from('chats')
    .select()
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }
  return chat;
}

export async function getMessagesByChatIdQuery(
  client: Client,
  { id }: { id: string }
) {
  const { data: messages, error } = await client
    .from('messages')
    .select()
    .eq('chat_id', id)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return messages;
}

export async function saveMessagesQuery(
  client: Client,
  {
    chatId,
    messages,
  }: {
    chatId: string;
    messages: Tables['messages']['Insert'][];
  }
) {
  const messagesWithChatId = messages.map((message) => ({
    ...message,
    chat_id: chatId,
  }));

  const { error } = await client.from('messages').insert(messagesWithChatId);

  if (error) throw error;
}

export async function voteMessageQuery(
  client: Client,
  {
    chatId,
    messageId,
    isUpvoted,
  }: {
    chatId: string;
    messageId: string;
    isUpvoted: boolean;
  }
) {
  const { data: message, error: messageError } = await client
    .from('messages')
    .select('id')
    .eq('id', messageId)
    .eq('chat_id', chatId)
    .single();

  if (messageError || !message) {
    throw new Error('Message not found or does not belong to this chat');
  }

  const { error } = await client.from('votes').upsert(
    {
      chat_id: chatId,
      message_id: messageId,
      is_upvoted: isUpvoted,
    },
    {
      onConflict: 'chat_id,message_id',
    }
  );

  if (error) throw error;
}

export async function getVotesByChatIdQuery(
  client: Client,
  { id }: { id: string }
) {
  const { data: votes, error } = await client
    .from('votes')
    .select()
    .eq('chat_id', id);

  if (error) throw error;
  return votes;
}

export async function getDocumentByIdQuery(
  client: Client,
  { id }: { id: string }
): Promise<Tables['documents']['Row'] | null> {
  const { data: documents, error } = await client
    .from('documents')
    .select()
    .eq('id', id)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) throw error;
  return documents?.[0] || null;
}

export async function saveDocumentQuery(
  client: Client,
  {
    id,
    title,
    content,
    userId,
  }: {
    id: string;
    title: string;
    content?: string;
    userId: string;
  }
) {
  const { error } = await client.from('documents').insert({
    id,
    title,
    content,
    user_id: userId,
  });

  if (error) throw error;
}

export async function getSuggestionsByDocumentIdQuery(
  client: Client,
  { documentId }: { documentId: string }
) {
  const { data: suggestions, error } = await client
    .from('suggestions')
    .select()
    .eq('document_id', documentId);

  if (error) throw error;
  return suggestions;
}

export async function saveSuggestionsQuery(
  client: Client,
  {
    documentId,
    documentCreatedAt,
    originalText,
    suggestedText,
    description,
    userId,
  }: {
    documentId: string;
    documentCreatedAt: string;
    originalText: string;
    suggestedText: string;
    description?: string;
    userId: string;
  }
) {
  const { error } = await client.from('suggestions').insert({
    document_id: documentId,
    document_created_at: documentCreatedAt,
    original_text: originalText,
    suggested_text: suggestedText,
    description,
    user_id: userId,
  });

  if (error) throw error;
}

export async function deleteDocumentsByIdAfterTimestampQuery(
  client: Client,
  { id, timestamp }: { id: string; timestamp: string }
) {
  const { error } = await client
    .from('documents')
    .delete()
    .eq('id', id)
    .gte('created_at', timestamp);

  if (error) throw error;
}

export async function getDocumentsByIdQuery(
  client: Client,
  { id }: { id: string }
) {
  const { data: documents, error } = await client
    .from('documents')
    .select()
    .eq('id', id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return documents;
}

export async function getChatWithMessagesQuery(
  client: Client,
  { id }: { id: string }
) {
  const { data: chat, error: chatError } = await client
    .from('chats')
    .select()
    .eq('id', id)
    .single();

  if (chatError) {
    if (chatError.code === 'PGRST116') {
      return null;
    }
    throw chatError;
  }

  const { data: messages, error: messagesError } = await client
    .from('messages')
    .select()
    .eq('chat_id', id)
    .order('created_at', { ascending: true });

  if (messagesError) throw messagesError;

  return {
    ...chat,
    messages: messages || [],
  };
}

type PostgrestError = {
  code: string;
  message: string;
  details: string | null;
  hint: string | null;
};

export function handleSupabaseError(error: PostgrestError | null) {
  if (!error) return null;

  if (error.code === 'PGRST116') {
    return null;
  }

  throw error;
}

// Memory Profile Queries
export async function createMemoryProfileQuery(
  client: Client,
  profile: {
    name: string;
    description?: string;
    relationship?: string;
    average_message_length?: number;
    common_words?: string[];
    emoticons_used?: string[];
    communication_patterns?: string[];
    total_messages?: number;
    date_range_start?: string;
    date_range_end?: string;
  }
) {
  // Get the current authenticated user
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError || !user) {
    throw new Error('User must be authenticated to create memory profile');
  }

  // Add user_id to the profile
  const profileWithUserId = {
    ...profile,
    user_id: user.id,
  };

  const { data, error } = await client
    .from('memory_profiles')
    .insert([profileWithUserId])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserMemoryProfilesQuery(client: Client) {
  const { data, error } = await client
    .from('memory_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getMemoryProfileByIdQuery(
  client: Client,
  profileId: string
) {
  const { data, error } = await client
    .from('memory_profiles')
    .select('*')
    .eq('id', profileId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }
  return data;
}

export async function updateMemoryProfileQuery(
  client: Client,
  profileId: string,
  updates: Partial<{
    name: string;
    description: string;
    relationship: string;
    training_status: string;
    average_message_length: number;
    common_words: string[];
    emoticons_used: string[];
    communication_patterns: string[];
    total_messages: number;
    date_range_start: string;
    date_range_end: string;
  }>
) {
  const { data, error } = await client
    .from('memory_profiles')
    .update(updates)
    .eq('id', profileId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMemoryProfileQuery(
  client: Client,
  profileId: string
) {
  const { error } = await client
    .from('memory_profiles')
    .delete()
    .eq('id', profileId);

  if (error) throw error;
}

// Training Messages Queries
export async function saveTrainingMessagesQuery(
  client: Client,
  messages: {
    memory_profile_id: string;
    original_timestamp: string;
    content: string;
    message_order: number;
  }[]
) {
  const { data, error } = await client
    .from('training_messages')
    .insert(messages)
    .select();

  if (error) throw error;
  return data;
}

export async function getTrainingMessagesQuery(
  client: Client,
  profileId: string
) {
  const { data, error } = await client
    .from('training_messages')
    .select('*')
    .eq('memory_profile_id', profileId)
    .order('original_timestamp', { ascending: true });

  if (error) throw error;
  return data || [];
}

// Memory Conversations Queries
export async function createMemoryConversationQuery(
  client: Client,
  conversation: {
    memory_profile_id: string;
    title: string;
  }
) {
  // Get the current authenticated user
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError || !user) {
    throw new Error('User must be authenticated to create memory conversation');
  }

  // Add user_id to the conversation
  const conversationWithUserId = {
    ...conversation,
    user_id: user.id,
  };

  const { data, error } = await client
    .from('memory_conversations')
    .insert([conversationWithUserId])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserMemoryConversationsQuery(client: Client) {
  const { data, error } = await client
    .from('memory_conversations')
    .select(
      `
      *,
      memory_profiles!inner(name, relationship)
    `
    )
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getMemoryConversationWithMessagesQuery(
  client: Client,
  conversationId: string
) {
  const { data: conversation, error: conversationError } = await client
    .from('memory_conversations')
    .select(
      `
      *,
      memory_profiles!inner(*)
    `
    )
    .eq('id', conversationId)
    .single();

  if (conversationError) {
    if (conversationError.code === 'PGRST116') {
      return null;
    }
    throw conversationError;
  }

  const { data: messages, error: messagesError } = await client
    .from('memory_messages')
    .select('*')
    .eq('memory_conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (messagesError) throw messagesError;

  return {
    ...conversation,
    messages: messages || [],
  };
}

export async function deleteMemoryConversationQuery(
  client: Client,
  conversationId: string
) {
  const { error } = await client
    .from('memory_conversations')
    .delete()
    .eq('id', conversationId);

  if (error) throw error;
}

// Memory Messages Queries
export async function saveMemoryMessageQuery(
  client: Client,
  message: {
    memory_conversation_id: string;
    role: 'user' | 'assistant';
    content: string;
  }
) {
  const { data, error } = await client
    .from('memory_messages')
    .insert([message])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Memory Session Queries
export async function createMemorySessionQuery(
  client: Client,
  memoryProfileId: string
) {
  // Get the current authenticated user
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError || !user) {
    throw new Error('User must be authenticated to create memory session');
  }

  // Check if user has used their monthly session
  const currentMonth = new Date().toISOString().slice(0, 7) + '-01'; // YYYY-MM-01 format

  const { data: usage, error: usageError } = await client
    .from('monthly_usage')
    .select('*')
    .eq('user_id', user.id)
    .eq('usage_month', currentMonth)
    .single();

  if (usageError && usageError.code !== 'PGRST116') {
    throw usageError;
  }

  // Check if user already had a session this month
  if (usage && usage.sessions_used && usage.sessions_used > 0) {
    throw new Error(
      'Monthly session limit reached. Please wait until next month.'
    );
  }

  // Close any existing active sessions for this user
  await client
    .from('memory_sessions')
    .update({ is_active: false, session_end: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('is_active', true);

  // Create new session
  const { data, error } = await client
    .from('memory_sessions')
    .insert([
      {
        user_id: user.id,
        memory_profile_id: memoryProfileId,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getActiveMemorySessionQuery(
  client: Client,
  memoryProfileId: string
) {
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError || !user) {
    throw new Error('User must be authenticated');
  }

  // First, close expired sessions
  await client.rpc('close_expired_sessions');

  const { data, error } = await client
    .from('memory_sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('memory_profile_id', memoryProfileId)
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
}

export async function closeMemorySessionQuery(
  client: Client,
  sessionId: string
) {
  const { data, error } = await client
    .from('memory_sessions')
    .update({
      is_active: false,
      session_end: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getMonthlyUsageQuery(client: Client) {
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError || !user) {
    throw new Error('User must be authenticated');
  }

  const currentMonth = new Date().toISOString().slice(0, 7) + '-01'; // YYYY-MM-01 format

  const { data, error } = await client
    .from('monthly_usage')
    .select('*')
    .eq('user_id', user.id)
    .eq('usage_month', currentMonth)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
}

export async function checkMonthlyLimitQuery(
  client: Client
): Promise<{ canStartSession: boolean; nextAvailableDate?: Date }> {
  const usage = await getMonthlyUsageQuery(client);

  if (!usage || !usage.sessions_used || usage.sessions_used === 0) {
    return { canStartSession: true };
  }

  // User has already used their monthly session
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(1);
  nextMonth.setHours(0, 0, 0, 0);

  return {
    canStartSession: false,
    nextAvailableDate: nextMonth,
  };
}

export async function updateMemoryConversationQuery(
  client: Client,
  conversationId: string,
  updates: { title?: string }
) {
  const { data, error } = await client
    .from('memory_conversations')
    .update(updates)
    .eq('id', conversationId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
