import { NextRequest, NextResponse } from 'next/server';
import {
  submitVideoJob as falSubmit,
  checkVideoStatus as falCheck,
  generateSceneVideo as falGenerate,
} from '@/lib/video-generator';
import {
  submitVideoJob as googleSubmit,
  checkVideoStatus as googleCheck,
  generateSceneVideo as googleGenerate,
} from '@/lib/google-video-generator';
import { VideoGenerationRequest } from '@/types';

export const maxDuration = 300;

/**
 * POST /api/video
 * Two modes:
 *   - { mode: "submit", imageUrl, prompt, provider? } → returns { requestId }
 *   - { imageUrl, prompt, provider? } → blocking, returns { videoUrl }
 */
export async function POST(request: NextRequest) {
  try {
    const body: VideoGenerationRequest & { mode?: string; provider?: string } =
      await request.json();
    const { imageUrl, prompt, duration, mode, provider } = body;

    if (!imageUrl || !prompt) {
      return NextResponse.json(
        { error: 'imageUrl and prompt required' },
        { status: 400 }
      );
    }

    const isGoogle = provider === 'google';

    if (mode === 'submit') {
      const submit = isGoogle ? googleSubmit : falSubmit;
      const { requestId } = await submit(imageUrl, prompt, { duration });
      return NextResponse.json({ requestId, status: 'QUEUED' });
    }

    const generate = isGoogle ? googleGenerate : falGenerate;
    const result = await generate(imageUrl, prompt, { duration });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Video generation error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Video generation failed',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/video?requestId=xxx&provider=fal|google
 */
export async function GET(request: NextRequest) {
  try {
    const requestId = request.nextUrl.searchParams.get('requestId');
    const provider = request.nextUrl.searchParams.get('provider');

    if (!requestId) {
      return NextResponse.json({ error: 'requestId required' }, { status: 400 });
    }

    const check = provider === 'google' ? googleCheck : falCheck;
    const result = await check(requestId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Video status check error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Status check failed',
      },
      { status: 500 }
    );
  }
}
