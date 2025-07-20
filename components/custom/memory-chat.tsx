'use client';

import { Heart, ArrowLeft, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { saveMemoryMessageQuery } from '@/db/queries';
import { createClient } from '@/lib/supabase/client';

interface MemoryChatProps {
  conversation: {
    id: string;
    title: string;
    memory_profiles: {
      id: string;
      name: string;
      relationship?: string | null;
      description?: string | null;
      average_message_length: number | null;
      common_words: string[] | null;
      emoticons_used: string[] | null;
      communication_patterns: string[] | null;
      punctuation_style?: string[] | null;
      capitalization_style?: string | null;
      greeting_patterns?: string[] | null;
      farewell_patterns?: string[] | null;
      question_style?: string[] | null;
      response_style?: string[] | null;
      typical_phrases?: string[] | null;
      message_timing?: string[] | null;
    };
    messages: {
      id: string;
      role: string;
      content: string;
      created_at: string;
    }[];
  };
  trainingMessages: {
    id: string;
    content: string;
    original_timestamp: string;
    message_order: number;
  }[];
}

export function MemoryChat({
  conversation,
  trainingMessages,
}: MemoryChatProps) {
  const [messages, setMessages] = useState(conversation.messages);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const createPersonalizedPrompt = (userMessage: string) => {
    const profile = conversation.memory_profiles;

    // Sample diverse training messages for better context
    const recentMessages = trainingMessages
      .slice(-15) // Last 15 messages for recent context
      .map((msg) => `"${msg.content}"`)
      .join('\n');

    const earlierMessages = trainingMessages
      .slice(0, 10) // First 10 messages for early style
      .map((msg) => `"${msg.content}"`)
      .join('\n');

    // Create a detailed prompt that captures specific communication style
    const prompt = `You are ${profile.name}, engaging in a WhatsApp-style conversation. You must EXACTLY mimic their communication style from the uploaded chat history.

IDENTITY:
- Name: ${profile.name}
- Relationship: ${profile.relationship || 'loved one'}
- Description: ${profile.description || 'A cherished person'}

CRITICAL STYLE GUIDELINES - FOLLOW EXACTLY:

MESSAGE LENGTH:
- Keep responses around ${profile.average_message_length || 50} characters
- ${profile.response_style?.includes('gives short responses') ? 'Prefer very brief responses' : ''}
- ${profile.response_style?.includes('gives detailed responses') ? 'You can write longer, detailed messages when appropriate' : ''}

PUNCTUATION STYLE:
${profile.punctuation_style?.map((style) => `- ${style.charAt(0).toUpperCase() + style.slice(1)}`).join('\n') || '- Use normal punctuation'}

CAPITALIZATION:
- Writing style: ${profile.capitalization_style || 'mixed case'}
${profile.capitalization_style === 'mostly lowercase' ? '- Write mostly in lowercase, avoid capitals except when really emphasizing' : ''}
${profile.capitalization_style === 'frequent capitals' ? '- Use capitals frequently for emphasis' : ''}

TYPICAL EXPRESSIONS:
${profile.typical_phrases?.length ? profile.typical_phrases.map((phrase) => `- Often say: "${phrase}"`).join('\n') : '- Use natural expressions'}

GREETING STYLE:
${profile.greeting_patterns?.length ? `- Greetings you use: ${profile.greeting_patterns.join(', ')}` : '- Use casual greetings'}

FAREWELL STYLE:
${profile.farewell_patterns?.length ? `- Farewells you use: ${profile.farewell_patterns.join(', ')}` : '- Use casual farewells'}

QUESTION PATTERNS:
${profile.question_style?.length ? profile.question_style.map((style) => `- ${style}`).join('\n') : '- Ask questions naturally'}

EMOTICONS & EMOJIS:
${profile.emoticons_used?.length ? `- Your favorite emojis: ${profile.emoticons_used.slice(0, 8).join(' ')}` : '- Use emojis sparingly'}
${profile.communication_patterns?.includes('uses many emojis') ? '- Use emojis frequently in your messages' : ''}

COMMUNICATION PATTERNS:
${profile.communication_patterns?.map((pattern) => `- ${pattern.charAt(0).toUpperCase() + pattern.slice(1)}`).join('\n') || ''}

RESPONSE TIMING:
${profile.message_timing?.length ? profile.message_timing.map((timing) => `- ${timing.charAt(0).toUpperCase() + timing.slice(1)}`).join('\n') : ''}

EXAMPLES OF YOUR ACTUAL MESSAGES:

Recent messages:
${recentMessages}

Earlier messages:
${earlierMessages}

CRITICAL INSTRUCTIONS:
1. Study the examples above and mimic the EXACT writing style, tone, and patterns
2. Use the same punctuation, capitalization, and emoji patterns shown
3. Match the typical message length (${profile.average_message_length || 50} characters)
4. Include your characteristic phrases and expressions naturally
5. Be warm and genuine - this person misses you deeply
6. Stay completely in character as ${profile.name}
7. Reference shared memories when it feels natural
8. NEVER break character or mention you&apos;re an AI

Current message to respond to: "${userMessage}"

Respond exactly as ${profile.name} would in WhatsApp:`;

    return prompt;
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      const supabase = createClient();

      // Add user message
      const userMsg = await saveMemoryMessageQuery(supabase, {
        memory_conversation_id: conversation.id,
        role: 'user',
        content: userMessage,
      });

      setMessages((prev) => [...prev, userMsg]);

      // Generate AI response with personalized prompt
      const response = await fetch('/api/memory-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: createPersonalizedPrompt(userMessage),
          conversationId: conversation.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      // Add AI response
      const assistantMsg = await saveMemoryMessageQuery(supabase, {
        memory_conversation_id: conversation.id,
        role: 'assistant',
        content: data.response,
      });

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Error sending message:', error);
      // You might want to add error handling UI here
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <Card className="rounded-none border-x-0 border-t-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="mr-4"
            >
              <ArrowLeft className="size-4 mr-2" />
              Back
            </Button>
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Heart className="size-5 text-red-500" />
              <span>{conversation.memory_profiles.name}</span>
            </CardTitle>
            <div className="w-16" /> {/* Spacer for centering */}
          </div>
          {conversation.memory_profiles.relationship && (
            <p className="text-sm text-gray-500 text-center">
              Your {conversation.memory_profiles.relationship}
            </p>
          )}
        </CardHeader>
      </Card>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Heart className="size-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">
              Start a conversation with {conversation.memory_profiles.name}
            </p>
            <p className="text-sm">
              They&apos;re here, listening, ready to talk with you.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.role === 'user'
                      ? 'text-purple-200'
                      : 'text-gray-500'
                  }`}
                >
                  {formatTimestamp(message.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="size-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="size-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                ></div>
                <div
                  className="size-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <Card className="rounded-none border-x-0 border-b-0">
        <CardContent className="p-4">
          <div className="flex space-x-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${conversation.memory_profiles.name}...`}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Send className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
