import { NextRequest, NextResponse } from 'next/server';
import { generateVoiceNarration } from '@/lib/voice-generator';
import { VoiceGenerationRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: VoiceGenerationRequest = await request.json();
    const { text, voiceTone } = body;

    if (!text) {
      return NextResponse.json({ error: 'Text required' }, { status: 400 });
    }

    const result = await generateVoiceNarration(text, voiceTone);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Voice generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Voice generation failed' },
      { status: 500 }
    );
  }
}
