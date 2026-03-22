import { NextRequest, NextResponse } from 'next/server';
import { generateSceneImage } from '@/lib/image-generator';
import { ImageGenerationRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: ImageGenerationRequest = await request.json();
    const { prompt, characterReferenceUrl, seed } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
    }

    const result = await generateSceneImage(prompt, characterReferenceUrl, seed);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Image generation failed' },
      { status: 500 }
    );
  }
}
