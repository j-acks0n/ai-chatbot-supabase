import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt, conversationId } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Use OpenAI to generate a response with the personalized prompt
    const result = await streamText({
      model: openai('gpt-4o'),
      messages: [
        {
          role: 'system',
          content: prompt,
        },
      ],
      temperature: 0.8, // Slightly higher temperature for more natural, varied responses
      maxTokens: 500, // Reasonable limit for chat messages
    });

    // Convert stream to text
    let fullResponse = '';
    for await (const textPart of result.textStream) {
      fullResponse += textPart;
    }

    return NextResponse.json({
      response: fullResponse.trim(),
      conversationId,
    });
  } catch (error) {
    console.error('Memory chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
