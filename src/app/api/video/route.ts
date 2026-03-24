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

    // Validate API key availability
    if (!isGoogle && !process.env.FAL_KEY) {
      console.error('[Video] FAL_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'FAL_KEY not configured. Please add it to your Vercel environment variables.' },
        { status: 500 }
      );
    }
    if (isGoogle && !process.env.GOOGLE_API_KEY) {
      console.error('[Video] GOOGLE_API_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'GOOGLE_API_KEY not configured.' },
        { status: 500 }
      );
    }

    if (mode === 'submit') {
      const submit = isGoogle ? googleSubmit : falSubmit;
      const { requestId } = await submit(imageUrl, prompt, { duration });
      console.log(`[Video] Submitted job: ${requestId} (provider: ${provider || 'fal'})`);
      return NextResponse.json({ requestId, status: 'QUEUED' });
    }

    const generate = isGoogle ? googleGenerate : falGenerate;
    const result = await generate(imageUrl, prompt, { duration });
    return NextResponse.json(result);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const errStack = error instanceof Error ? error.stack : '';
    console.error('[Video] Generation error:', errMsg);
    if (errStack) console.error('[Video] Stack:', errStack);
    return NextResponse.json(
      { error: errMsg || 'Video generation failed' },
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

    // Validate API key availability
    if (provider !== 'google' && !process.env.FAL_KEY) {
      console.error('[Video] FAL_KEY not set for status check');
      return NextResponse.json(
        { error: 'FAL_KEY not configured', status: 'FAILED' },
        { status: 500 }
      );
    }

    const check = provider === 'google' ? googleCheck : falCheck;
    const result = await check(requestId);
    return NextResponse.json(result);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Video] Status check error for requestId=${request.nextUrl.searchParams.get('requestId')}:`, errMsg);
    
    // If the error is about an invalid/expired request, return FAILED status
    // so the client stops polling instead of retrying forever
    if (errMsg.includes('not found') || errMsg.includes('NOT_FOUND') || errMsg.includes('expired') || errMsg.includes('Unauthorized') || errMsg.includes('401')) {
      return NextResponse.json(
        { status: 'FAILED', error: errMsg },
        { status: 200 } // Return 200 with FAILED status so client handles it gracefully
      );
    }
    
    return NextResponse.json(
      { error: errMsg || 'Status check failed' },
      { status: 500 }
    );
  }
}
