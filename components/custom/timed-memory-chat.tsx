'use client';

import {
  Heart,
  ArrowLeft,
  Send,
  Clock,
  AlertTriangle,
  User,
} from 'lucide-react';
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
      // Calculate expected response length based on person's style
      const expectedLength =
        session.memory_profiles.average_message_length || 50;

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

      // Validate response length and authenticity
      let finalResponse = data.response;
      if (finalResponse.length > expectedLength * 2) {
        console.warn("Response too long, truncating to match person's style");
        const truncated = finalResponse.substring(0, expectedLength * 1.5);
        const lastPeriod = truncated.lastIndexOf('.');
        finalResponse =
          lastPeriod > 0 ? truncated.substring(0, lastPeriod + 1) : truncated;
      }

      // Add AI response to local state
      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: finalResponse,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove the user message if there was an error
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== Date.now().toString())
      );
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto border-0 shadow-xl ring-1 ring-gray-200/50">
          <CardContent className="text-center p-8">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Session Complete
            </h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Your 10-minute conversation with {session.memory_profiles.name}{' '}
              has ended.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Take time to reflect on your conversation. You can start a new
              session next month.
            </p>
            <div className="w-8 h-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mx-auto mb-4" />
            <p className="text-xs text-gray-500">Redirecting you back...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const timerColor =
    timeRemaining <= 60
      ? 'text-red-500'
      : timeRemaining <= 120
        ? 'text-orange-500'
        : 'text-purple-600';
  const timerBgColor =
    timeRemaining <= 60
      ? 'bg-red-50 border-red-200'
      : timeRemaining <= 120
        ? 'bg-orange-50 border-orange-200'
        : 'bg-purple-50 border-purple-200';

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header with Timer */}
      <Card className="rounded-none border-x-0 border-t-0 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                router.push(`/memories/${session.memory_profile_id}`)
              }
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              End Session
            </Button>

            <div className="text-center">
              <CardTitle className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-purple-600" />
                </div>
                <span>{session.memory_profiles.name}</span>
              </CardTitle>
              {session.memory_profiles.relationship && (
                <p className="text-sm text-gray-500 mt-1">
                  Your {session.memory_profiles.relationship}
                </p>
              )}
            </div>

            <div
              className={`flex items-center space-x-2 px-3 py-2 rounded-full ${timerBgColor} border`}
            >
              <Clock className={`w-4 h-4 ${timerColor}`} />
              <span className={`font-mono text-sm font-medium ${timerColor}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>

          {timeRemaining <= 120 && (
            <div className={`mt-3 p-3 rounded-lg ${timerBgColor} border`}>
              <div className="flex items-center justify-center space-x-2">
                <AlertTriangle className={`w-4 h-4 ${timerColor}`} />
                <p className={`text-sm font-medium ${timerColor}`}>
                  {timeRemaining <= 60
                    ? 'Session ending soon!'
                    : 'Less than 2 minutes remaining'}
                </p>
              </div>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
              <User className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Connected with {session.memory_profiles.name}
            </h3>
            <p className="text-gray-600 mb-4">
              Your session has started. You have {formatTime(timeRemaining)} to
              chat together.
            </p>
            <div className="w-12 h-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mx-auto" />
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="max-w-xs lg:max-w-md">
                <div
                  className={`px-4 py-3 rounded-2xl shadow-sm ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
                <p
                  className={`text-xs mt-1 px-2 ${
                    message.role === 'user'
                      ? 'text-purple-600'
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
            <div className="max-w-xs lg:max-w-md">
              <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl shadow-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <Card className="rounded-none border-x-0 border-b-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex space-x-3">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${session.memory_profiles.name}...`}
              disabled={isLoading || isSessionExpired}
              className="flex-1 h-12 rounded-full border-gray-300 focus:border-purple-500 focus:ring-purple-500/20"
            />
            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading || isSessionExpired}
              className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
