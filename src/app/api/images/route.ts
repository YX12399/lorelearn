import { NextRequest, NextResponse } from 'next/server';
import { generateSceneImage as falImage } from '@/lib/image-generator';
import { generateSceneImage as googleImage } from '@/lib/google-image-generator';
import { ImageGenerationRequest } from '@/types';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body: ImageGenerationRequest & { provider?: string } = await request.json();
    const { prompt, characterReferenceUrl, seed, isFirstScene, provider } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
    }

    const gen = provider === 'google' ? googleImage : falImage;
    const result = await gen(prompt, characterReferenceUrl, seed, isFirstScene);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Image generation failed' },
      { status: 500 }
    );
  }
}
