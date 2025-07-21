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

    // Calculate actual average message length from training data
    const actualAverageLength = Math.round(
      trainingMessages.reduce((sum, msg) => sum + msg.content.length, 0) /
        trainingMessages.length
    );

    // Extract actual vocabulary and phrases from their messages
    const allMessages = trainingMessages.map((msg) => msg.content);
    const allText = allMessages.join(' ').toLowerCase();

    // Extract their actual vocabulary (words they actually use)
    const actualWords = [
      ...new Set(
        allText
          .split(/\s+/)
          .filter((word) => word.length > 0 && /^[a-zA-Z0-9']+$/.test(word))
      ),
    ];

    // Extract their actual emojis used
    const emojiRegex =
      /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    const actualEmojis = [...new Set(allText.match(emojiRegex) || [])];

    // Find common conversational phrases (2-4 words) they actually use
    const commonPhrases: string[] = [];
    for (let msg of allMessages) {
      const words = msg.toLowerCase().split(/\s+/);
      // Look for 2-word phrases
      for (let i = 0; i < words.length - 1; i++) {
        const phrase = words.slice(i, i + 2).join(' ');
        if (phrase.length > 3 && phrase.length < 20) {
          commonPhrases.push(phrase);
        }
      }
      // Look for 3-word phrases
      for (let i = 0; i < words.length - 2; i++) {
        const phrase = words.slice(i, i + 3).join(' ');
        if (phrase.length > 5 && phrase.length < 25) {
          commonPhrases.push(phrase);
        }
      }
    }
    const uniquePhrases = [...new Set(commonPhrases)]
      .filter((phrase) => commonPhrases.filter((p) => p === phrase).length >= 1)
      .slice(0, 20);

    // Find conversational elements they use
    const greetingWords = actualWords.filter((word) =>
      [
        'hey',
        'hi',
        'hello',
        'sup',
        'yo',
        'morning',
        'evening',
        'good',
      ].includes(word.toLowerCase())
    );

    const questionWords = actualWords.filter((word) =>
      [
        'how',
        'what',
        'where',
        'when',
        'why',
        'who',
        'are',
        'do',
        'did',
        'can',
        'will',
        'have',
        'would',
        'could',
        'should',
      ].includes(word.toLowerCase())
    );

    const responseWords = actualWords.filter((word) =>
      [
        'yes',
        'no',
        'yeah',
        'nah',
        'ok',
        'okay',
        'sure',
        'maybe',
        'good',
        'bad',
        'fine',
        'great',
        'nice',
        'cool',
        'awesome',
        'right',
        'true',
        'exactly',
      ].includes(word.toLowerCase())
    );

    const conversationFillers = actualWords.filter((word) =>
      [
        'like',
        'just',
        'really',
        'pretty',
        'very',
        'so',
        'too',
        'well',
        'now',
        'then',
        'also',
        'actually',
        'probably',
        'maybe',
        'definitely',
      ].includes(word.toLowerCase())
    );

    const connectingWords = actualWords.filter((word) =>
      [
        'and',
        'but',
        'or',
        'because',
        'since',
        'while',
        'though',
        'although',
        'if',
        'when',
        'where',
        'that',
        'which',
      ].includes(word.toLowerCase())
    );

    // Analyze their conversation style
    const messageLengths = allMessages.map((msg) => msg.length);
    const shortMessages = messageLengths.filter((len) => len <= 20);
    const mediumMessages = messageLengths.filter(
      (len) => len > 20 && len <= 50
    );
    const longMessages = messageLengths.filter((len) => len > 50);

    const lowercaseMessages = allMessages.filter(
      (msg) => msg === msg.toLowerCase()
    );
    const hasNoCapitals = lowercaseMessages.length > allMessages.length * 0.5;

    const noPunctuationMessages = allMessages.filter(
      (msg) => !/[.!?]/.test(msg)
    );
    const hasPunctuation =
      noPunctuationMessages.length < allMessages.length * 0.5;

    const hasAbbreviations =
      allText.includes(' u ') ||
      allText.includes(' ur ') ||
      allText.includes(' thx ');

    // Create a conversational prompt that encourages natural flow
    const prompt = `You are ${profile.name} having a real conversation. Be natural, engaging, and conversational using ONLY their actual words.

USER SAID: "${userMessage}"

YOUR CONVERSATION VOCABULARY:
${actualWords.slice(0, 100).join(', ')}

YOUR NATURAL PHRASES (use these for flow):
${uniquePhrases.slice(0, 15).join(', ') || 'combine words naturally'}

CONVERSATION TOOLS:
- GREETINGS: ${greetingWords.join(', ') || 'basic greetings'}
- QUESTIONS: ${questionWords.join(', ') || 'no questions'}  
- RESPONSES: ${responseWords.join(', ') || 'basic responses'}
- FILLERS: ${conversationFillers.join(', ') || 'none'}
- CONNECTORS: ${connectingWords.join(', ') || 'basic words'}
- EMOJIS: ${actualEmojis.slice(0, 8).join(' ') || 'no emojis'}

CONVERSATIONAL STYLE:
- Length preference: ${shortMessages.length > mediumMessages.length ? 'Brief but engaging' : longMessages.length > mediumMessages.length ? 'Longer, detailed responses' : 'Medium conversational length'}
- Capitalization: ${hasNoCapitals ? 'Casual lowercase style' : 'Standard capitalization'}
- Punctuation: ${hasPunctuation ? 'Uses punctuation for flow' : 'Minimal punctuation, casual style'}
- Text style: ${hasAbbreviations ? 'Uses abbreviations like u, ur, thx' : 'Spells words out'}

BE CONVERSATIONAL:
1. Engage with what they said - show interest and ask follow-up questions
2. Use their natural phrases and conversation flow
3. Add their filler words to make it sound natural
4. Sometimes ask questions back to keep conversation going
5. React genuinely to what they share using their vocabulary
6. Use connecting words to make responses flow better
7. Match their energy level and conversation style
8. Vary response length based on the context and their style
9. Be warm and personal like they would be

CONVERSATION EXAMPLES:
- If they greet: Greet back warmly and maybe ask how they are
- If they ask how you are: Answer and ask them back
- If they share news: React with their words and ask follow-up
- If they ask a question: Answer and continue the conversation

Make it feel like a real conversation with ${profile.name}, not just single-word responses!

USER MESSAGE: "${userMessage}"

Respond conversationally as ${profile.name} would:`;

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
