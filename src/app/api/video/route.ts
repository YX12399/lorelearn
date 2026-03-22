import { NextRequest, NextResponse } from 'next/server';
import { generateSceneVideo } from '@/lib/video-generator';
import { VideoGenerationRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: VideoGenerationRequest = await request.json();
    const { imageUrl, prompt, startFrameUrl, endFrameUrl, characterReferenceUrls, duration } = body;

    if (!imageUrl || !prompt) {
      return NextResponse.json({ error: 'imageUrl and prompt required' }, { status: 400 });
    }

    const result = await generateSceneVideo(imageUrl, prompt, {
      startFrameUrl,
      endFrameUrl,
      characterReferenceUrls,
      duration,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Video generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Video generation failed' },
      { status: 500 }
    );
  }
}
