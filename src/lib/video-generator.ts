import { fal } from '@fal-ai/client';

fal.config({ credentials: process.env.FAL_KEY });

// Kling 3.0 on fal.ai — best cinematic video model available
// Not yet in the @fal-ai/client type defs, so we use a generic endpoint string.
const KLING_MODEL = 'fal-ai/kling-video/v3/standard/image-to-video';

/**
 * Submit a Kling 3.0 video generation job (non-blocking).
 * Returns a requestId for polling via checkVideoStatus().
 */
export async function submitVideoJob(
  imageUrl: string,
  prompt: string,
  options: {
    duration?: number;
    endImageUrl?: string;
    enableAudio?: boolean;
  } = {}
): Promise<{ requestId: string }> {
  const { duration = 5, endImageUrl } = options;

  const videoPrompt = buildVideoPrompt(prompt);

  const input: Record<string, unknown> = {
    prompt: videoPrompt,
    start_image_url: imageUrl,
    duration: duration >= 10 ? '10' : '5',
  };

  if (endImageUrl) {
    input.end_image_url = endImageUrl;
  }

  const { request_id } = await fal.queue.submit(KLING_MODEL, {
    input,
  });

  return { requestId: request_id };
}

/**
 * Check status of a queued video generation job.
 */
export async function checkVideoStatus(
  requestId: string
): Promise<{ status: string; videoUrl?: string }> {
  const statusResult = await fal.queue.status(KLING_MODEL, {
    requestId,
    logs: false,
  });

  // Cast status to string since the runtime API can return statuses
  // not in the SDK type definitions (e.g. 'FAILED')
  const status = statusResult.status as string;

  if (status === 'COMPLETED') {
    const result = await fal.queue.result(KLING_MODEL, { requestId });
    const data = result.data as Record<string, unknown>;

    let videoUrl: string | undefined;
    if (data.video && typeof data.video === 'object') {
      videoUrl = (data.video as Record<string, unknown>).url as string;
    } else if (typeof data.video_url === 'string') {
      videoUrl = data.video_url;
    }

    return { status: 'COMPLETED', videoUrl };
  }

  if (status === 'FAILED') {
    return { status: 'FAILED', videoUrl: undefined };
  }

  return {
    status: status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'IN_QUEUE',
  };
}

/**
 * Blocking video generation — subscribes until complete.
 * WARNING: Can take 2-5 minutes. Use submitVideoJob + checkVideoStatus for serverless.
 */
export async function generateSceneVideo(
  imageUrl: string,
  prompt: string,
  options: {
    startFrameUrl?: string;
    endFrameUrl?: string;
    characterReferenceUrls?: string[];
    duration?: number;
  } = {}
): Promise<{ videoUrl: string; endFrameUrl?: string }> {
  const videoPrompt = buildVideoPrompt(prompt);

  const input: Record<string, unknown> = {
    prompt: videoPrompt,
    start_image_url: imageUrl,
    duration: (options.duration ?? 5) >= 10 ? '10' : '5',
  };

  if (options.endFrameUrl) {
    input.end_image_url = options.endFrameUrl;
  }

  const result = await fal.subscribe(KLING_MODEL, {
    input,
    logs: false,
  });

  const data = result.data as Record<string, unknown>;
  let videoUrl: string | undefined;
  if (data.video && typeof data.video === 'object') {
    videoUrl = (data.video as Record<string, unknown>).url as string;
  } else if (typeof data.video_url === 'string') {
    videoUrl = data.video_url;
  }

  if (!videoUrl) {
    throw new Error('No video URL returned from Kling 3.0');
  }

  return { videoUrl, endFrameUrl: imageUrl };
}

/**
 * Submit multiple scene videos in parallel.
 * Returns requestIds for polling — the client stitches them together.
 */
export async function generateMultiShotVideo(
  shots: Array<{ imageUrl: string; prompt: string; duration: number }>
): Promise<{ videoUrl: string; videoUrls: string[]; requestIds: string[] }> {
  const submissions = shots.slice(0, 6).map(async (shot) => {
    const { requestId } = await submitVideoJob(shot.imageUrl, shot.prompt, {
      duration: shot.duration,
    });
    return requestId;
  });

  const requestIds = await Promise.all(submissions);

  return { videoUrl: '', videoUrls: [], requestIds };
}

/**
 * Build a rich cinematic video prompt with motion and atmosphere cues.
 * Kling 3.0 responds beautifully to detailed cinematic direction.
 */
function buildVideoPrompt(prompt: string): string {
  return [
    prompt,
    'Cinematic smooth fluid animation, professional production quality.',
    'Beautiful detailed lighting with soft volumetric rays and rich color grading.',
    'Gentle natural camera motion, no abrupt cuts or flashing.',
    'Subtle ambient motion: hair and cloth movement, atmospheric particles, environmental life.',
  ].join(' ');
}
