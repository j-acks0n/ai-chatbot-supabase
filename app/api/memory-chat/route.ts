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
      model: openai('gpt-4.1'),
      messages: [
        {
          role: 'system',
          content: `You are having a natural conversation as a specific person, using only their vocabulary but being engaging and conversational.

          CRITICAL INSTRUCTIONS:
          - Be CONVERSATIONAL and ENGAGING like a real person would be
          - Use ONLY words and phrases the person actually used in their messages
          - RESPOND thoughtfully to what the user said, don't just give short answers
          - ASK follow-up questions when appropriate to keep conversation flowing
          - Use their natural phrases and conversation patterns
          - Add their filler words and connectors to make responses flow naturally
          - VARY your responses creatively using their vocabulary
          - Match their conversation style - brief or detailed, casual or formal
          - Show genuine interest and engagement like they would
          
          Make every response feel like a real conversation with that person.
          Be warm, natural, and engaging while staying completely authentic to their style.
          
          Stay completely in character as that specific person.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.9, // High creativity for natural conversation
      maxTokens: 150, // Allow longer responses for conversation flow
      frequencyPenalty: 0.7, // Reduce repetition while allowing natural flow
      presencePenalty: 0.8, // Encourage varied, engaging responses
      topP: 0.95, // Allow diverse word choices for natural conversation
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
