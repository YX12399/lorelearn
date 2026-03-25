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

    if (!process.env.ELEVENLABS_API_KEY) {
      console.error('[Voice] ELEVENLABS_API_KEY not set');
      return NextResponse.json(
        { error: 'ELEVENLABS_API_KEY not configured. Add it to Vercel environment variables.' },
        { status: 500 }
      );
    }

    const result = await generateVoiceNarration(text, voiceTone);
    return NextResponse.json(result);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Voice] Error:', errMsg);
    return NextResponse.json({ error: errMsg || 'Voice generation failed' }, { status: 500 });
  }
}
