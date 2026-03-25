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
 *   { mode: "submit", imageUrl, prompt, duration?, provider? } → { requestId }
 *   { imageUrl, prompt, duration?, provider? }                 → { videoUrl }
 */
export async function POST(request: NextRequest) {
  try {
    const body: VideoGenerationRequest & { mode?: string; provider?: string } =
      await request.json();
    const { imageUrl, prompt, duration, mode, provider } = body;

    if (!imageUrl || !prompt) {
      return NextResponse.json({ error: 'imageUrl and prompt required' }, { status: 400 });
    }

    const isGoogle = provider === 'google';

    // Validate API key
    if (!isGoogle && !process.env.FAL_KEY) {
      console.error('[Video] FAL_KEY not set');
      return NextResponse.json(
        { status: 'FAILED', error: 'FAL_KEY not configured. Add it to Vercel environment variables.' },
        { status: 200 }
      );
    }
    if (isGoogle && !process.env.GOOGLE_API_KEY) {
      console.error('[Video] GOOGLE_API_KEY not set');
      return NextResponse.json(
        { status: 'FAILED', error: 'GOOGLE_API_KEY not configured.' },
        { status: 200 }
      );
    }

    if (mode === 'submit') {
      const submit = isGoogle ? googleSubmit : falSubmit;
      const { requestId } = await submit(imageUrl, prompt, { duration });
      console.log(`[Video] Job submitted: ${requestId} (${provider || 'fal'})`);
      return NextResponse.json({ requestId, status: 'QUEUED' });
    }

    const generate = isGoogle ? googleGenerate : falGenerate;
    const result = await generate(imageUrl, prompt, { duration });
    return NextResponse.json(result);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Video] POST error:', errMsg);

    // Return FAILED with 200 so the client stops retrying for known errors
    if (errMsg.includes('Unauthorized') || errMsg.includes('401') || errMsg.includes('not found') || errMsg.includes('FAL_KEY')) {
      return NextResponse.json({ status: 'FAILED', error: errMsg }, { status: 200 });
    }

    return NextResponse.json({ error: errMsg || 'Video generation failed' }, { status: 500 });
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

    // Validate API key
    if (provider !== 'google' && !process.env.FAL_KEY) {
      return NextResponse.json(
        { status: 'FAILED', error: 'FAL_KEY not configured' },
        { status: 200 }
      );
    }

    const check = provider === 'google' ? googleCheck : falCheck;
    const result = await check(requestId);
    return NextResponse.json(result);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Video] GET error (${request.nextUrl.searchParams.get('requestId')}):`, errMsg);

    // Return FAILED with 200 for unrecoverable errors to stop infinite polling
    if (
      errMsg.includes('not found') || errMsg.includes('NOT_FOUND') ||
      errMsg.includes('expired') || errMsg.includes('Unauthorized') ||
      errMsg.includes('401')
    ) {
      return NextResponse.json({ status: 'FAILED', error: errMsg }, { status: 200 });
    }

    return NextResponse.json({ error: errMsg || 'Status check failed' }, { status: 500 });
  }
}
