import { fal } from '@fal-ai/client';

/**
 * Submit a video generation job to the queue (non-blocking).
 * Returns a request_id that can be polled for status.
 */
export async function submitVideoJob(
  imageUrl: string,
  prompt: string,
  options: {
    duration?: number;
  } = {}
): Promise<{ requestId: string }> {
  fal.config({ credentials: process.env.FAL_KEY });
  const { duration = 5 } = options;

  const videoPrompt = [
    prompt,
    'Smooth gentle animation with natural character movement.',
    'Child-friendly, no sudden jumps, no flashing, no rapid camera moves.',
    'Warm soft lighting throughout. Consistent character appearance.',
    'Subtle ambient motion: hair sway, blinking, gentle breathing, light particles.',
  ].join(' ');

  // Kling v1.6 Pro accepts: prompt, image_url, duration (string), aspect_ratio
  // It does NOT accept: cfg_scale, motion_bucket_id, start_image_url, end_image_url
  const result = await fal.queue.submit('fal-ai/kling-video/v1.6/pro/image-to-video', {
    input: {
      prompt: videoPrompt,
      image_url: imageUrl,
      duration: (duration >= 10 ? '10' : '5') as '5' | '10',     // Kling expects "5" or "10" as string
      aspect_ratio: '16:9',
    },
  });

  return { requestId: result.request_id };
}

/**
 * Check the status of a queued video generation job.
 */
export async function checkVideoStatus(
  requestId: string
): Promise<{ status: string; videoUrl?: string; endFrameUrl?: string }> {
  fal.config({ credentials: process.env.FAL_KEY });

  const status = await fal.queue.status('fal-ai/kling-video/v1.6/pro/image-to-video', {
    requestId,
    logs: false,
  });

  if (status.status === 'COMPLETED') {
    const result = await fal.queue.result('fal-ai/kling-video/v1.6/pro/image-to-video', {
      requestId,
    });

    const output = result.data as Record<string, unknown>;
    const videoData = output.video as { url?: string } | string | undefined;
    const videoUrl = typeof videoData === 'string' ? videoData : videoData?.url;

    return {
      status: 'COMPLETED',
      videoUrl: videoUrl || undefined,
    };
  }

  return { status: status.status }; // IN_QUEUE, IN_PROGRESS, etc.
}

/**
 * Generate a single scene video from a keyframe image (blocking).
 * Uses fal.subscribe which polls internally until done.
 * WARNING: This can take 2-5 minutes. Only use where timeout allows.
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
  fal.config({ credentials: process.env.FAL_KEY });
  const { duration = 5 } = options;

  const videoPrompt = [
    prompt,
    'Smooth gentle animation with natural character movement.',
    'Child-friendly, no sudden jumps, no flashing, no rapid camera moves.',
    'Warm soft lighting throughout. Consistent character appearance.',
    'Subtle ambient motion: hair sway, blinking, gentle breathing, light particles.',
  ].join(' ');

  // Kling v1.6 Pro parameters — only send what the API actually accepts
  const result = await fal.subscribe('fal-ai/kling-video/v1.6/pro/image-to-video', {
    input: {
      prompt: videoPrompt,
      image_url: imageUrl,
      duration: (duration >= 10 ? '10' : '5') as '5' | '10',
      aspect_ratio: '16:9',
    } as Parameters<typeof fal.subscribe>[1]['input'],
    logs: false,
    pollInterval: 3000,   // Poll every 3 seconds
  });

  const output = result.data as Record<string, unknown>;
  const videoData = output.video as { url?: string } | string | undefined;
  const videoUrl = typeof videoData === 'string' ? videoData : videoData?.url;

  if (!videoUrl) {
    throw new Error('No video URL returned from fal.ai');
  }

  return {
    videoUrl,
    endFrameUrl: imageUrl,
  };
}

/**
 * Generate a multi-shot cohesive video from a series of scene images.
 * Uses queue-based submission for each shot to avoid timeouts.
 */
export async function generateMultiShotVideo(
  shots: Array<{ imageUrl: string; prompt: string; duration: number }>,
  _characterReferenceUrls?: string[]
): Promise<{ videoUrl: string; videoUrls: string[]; requestIds: string[] }> {
  fal.config({ credentials: process.env.FAL_KEY });

  const requestIds: string[] = [];

  // Submit all shots to the queue in parallel
  const submissions = shots.slice(0, 6).map(async (shot) => {
    const result = await fal.queue.submit('fal-ai/kling-video/v1.6/pro/image-to-video', {
      input: {
        prompt: shot.prompt,
        image_url: shot.imageUrl,
        duration: (shot.duration >= 10 ? '10' : '5') as '5' | '10',
        aspect_ratio: '16:9',
      },
    });
    return result.request_id;
  });

  const ids = await Promise.all(submissions);
  requestIds.push(...ids);

  // Return request IDs for the client to poll
  return {
    videoUrl: '',
    videoUrls: [],
    requestIds,
  };
}
