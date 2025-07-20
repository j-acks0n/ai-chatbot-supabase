'use client';

import { Heart, ArrowLeft, Send, Clock, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { closeMemorySessionQuery } from '@/db/queries';
import { createClient } from '@/lib/supabase/client';

interface TimedMemoryChatProps {
  session: {
    id: string;
    session_start: string;
    memory_profile_id: string;
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
  };
  trainingMessages: {
    id: string;
    content: string;
    original_timestamp: string;
    message_order: number;
  }[];
}

export function TimedMemoryChat({
  session,
  trainingMessages,
}: TimedMemoryChatProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Calculate initial time remaining
    const sessionStart = new Date(session.session_start);
    const now = new Date();
    const elapsedSeconds = Math.floor(
      (now.getTime() - sessionStart.getTime()) / 1000
    );
    const remaining = Math.max(0, 600 - elapsedSeconds);

    setTimeRemaining(remaining);

    if (remaining <= 0) {
      setIsSessionExpired(true);
      handleSessionEnd();
      return;
    }

    // Start countdown timer
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsSessionExpired(true);
          handleSessionEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSessionEnd = async () => {
    try {
      const supabase = createClient();
      await closeMemorySessionQuery(supabase, session.id);

      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/memories/${session.memory_profile_id}`);
      }, 3000);
    } catch (error) {
      console.error('Error closing session:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const createPersonalizedPrompt = (userMessage: string) => {
    const profile = session.memory_profiles;

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
    if (!inputMessage.trim() || isLoading || isSessionExpired) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message to local state
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      // Generate AI response with personalized prompt
      const response = await fetch('/api/memory-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: createPersonalizedPrompt(userMessage),
          conversationId: session.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      // Add AI response to local state
      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Error sending message:', error);
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

  if (isSessionExpired) {
    return (
      <div className="flex flex-col h-screen">
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center p-6">
              <AlertTriangle className="size-16 mx-auto mb-4 text-orange-500" />
              <h2 className="text-xl font-bold mb-2">Session Ended</h2>
              <p className="text-gray-600 mb-4">
                Your 10-minute session has ended. You can start a new session
                next month.
              </p>
              <p className="text-sm text-gray-500">Redirecting you back...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header with Timer */}
      <Card className="rounded-none border-x-0 border-t-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                router.push(`/memories/${session.memory_profile_id}`)
              }
              className="mr-4"
            >
              <ArrowLeft className="size-4 mr-2" />
              End Session
            </Button>
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Heart className="size-5 text-red-500" />
              <span>{session.memory_profiles.name}</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Clock
                className={`size-4 ${timeRemaining <= 60 ? 'text-red-500' : 'text-purple-600'}`}
              />
              <span
                className={`font-mono text-sm ${timeRemaining <= 60 ? 'text-red-500 font-bold' : 'text-purple-600'}`}
              >
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
          {session.memory_profiles.relationship && (
            <p className="text-sm text-gray-500 text-center">
              Your {session.memory_profiles.relationship}
            </p>
          )}
          {timeRemaining <= 120 && (
            <div className="mt-2 p-2 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-xs text-orange-700 text-center">
                {timeRemaining <= 60
                  ? 'Session ending soon!'
                  : 'Less than 2 minutes remaining'}
              </p>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Heart className="size-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">
              Your session with {session.memory_profiles.name} has started
            </p>
            <p className="text-sm">
              You have {formatTime(timeRemaining)} to chat together.
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
              placeholder={`Message ${session.memory_profiles.name}...`}
              disabled={isLoading || isSessionExpired}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading || isSessionExpired}
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
