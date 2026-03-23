import { NextRequest, NextResponse } from 'next/server';
import { submitVideoJob, checkVideoStatus, generateSceneVideo } from '@/lib/video-generator';
import { VideoGenerationRequest } from '@/types';

// Allow up to 5 minutes for video generation (requires Vercel Pro; hobby max is 60s)
export const maxDuration = 300;

/**
 * POST /api/video
 * Two modes:
 *   - { mode: "submit", imageUrl, prompt } → returns { requestId } immediately
 *   - { imageUrl, prompt } (no mode) → blocking call, returns { videoUrl } when done
 */
export async function POST(request: NextRequest) {
  try {
    const body: VideoGenerationRequest & { mode?: string } = await request.json();
    const { imageUrl, prompt, duration, mode } = body;

    if (!imageUrl || !prompt) {
      return NextResponse.json(
        { error: 'imageUrl and prompt required' },
        { status: 400 }
      );
    }

    // Queue mode: submit and return immediately with request ID
    if (mode === 'submit') {
      const { requestId } = await submitVideoJob(imageUrl, prompt, { duration });
      return NextResponse.json({ requestId, status: 'QUEUED' });
    }

    // Blocking mode: wait for completion (may timeout on hobby plan)
    const result = await generateSceneVideo(imageUrl, prompt, { duration });
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
 * GET /api/video?requestId=xxx
 * Poll for video generation status
 */
export async function GET(request: NextRequest) {
  try {
    const requestId = request.nextUrl.searchParams.get('requestId');
    if (!requestId) {
      return NextResponse.json({ error: 'requestId required' }, { status: 400 });
    }

    const result = await checkVideoStatus(requestId);
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
