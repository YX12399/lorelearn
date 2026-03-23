import { fal } from '@fal-ai/client';

/**
 * Generate a single scene video from a keyframe image.
 * Returns the video URL and attempts to capture the last frame
 * for continuity with the next scene.
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

  // Build a video-specific prompt that enforces smooth, child-safe animation
  const videoPrompt = [
    prompt,
    'Smooth gentle animation with natural character movement.',
    'Child-friendly, no sudden jumps, no flashing, no rapid camera moves.',
    'Warm soft lighting throughout. Consistent character appearance.',
    'Subtle ambient motion: hair sway, blinking, gentle breathing, light particles.',
  ].join(' ');

  const input: Record<string, unknown> = {
    prompt: videoPrompt,
    image_url: imageUrl,
    duration,
    aspect_ratio: '16:9',
    cfg_scale: 0.5,
    motion_bucket_id: 80, // Lower = less motion = more consistent
  };

  // Chain scenes by using previous scene's end frame as this scene's start
  if (options.startFrameUrl) {
    input.start_image_url = options.startFrameUrl;
  }
  if (options.endFrameUrl) {
    input.end_image_url = options.endFrameUrl;
  }

  const result = await fal.subscribe('fal-ai/kling-video/v1.6/pro/image-to-video', {
    input: input as Parameters<typeof fal.subscribe>[1]['input'],
    logs: false,
  });

  const output = result.data as Record<string, unknown>;
  const videoData = output.video as { url?: string } | string | undefined;
  const videoUrl = typeof videoData === 'string' ? videoData : videoData?.url;

  if (!videoUrl) {
    throw new Error('No video URL returned from fal.ai');
  }

  // Use the scene's own image as the "end frame" fallback for chaining.
  // The next scene will receive this as its startFrameUrl, creating visual continuity.
  return {
    videoUrl,
    endFrameUrl: imageUrl, // Best available reference for scene continuity
  };
}

/**
 * Generate a multi-shot cohesive video from a series of scene images.
 * Processes shots sequentially, chaining end frames for continuity.
 * Returns all individual video URLs for client-side assembly.
 */
export async function generateMultiShotVideo(
  shots: Array<{ imageUrl: string; prompt: string; duration: number }>,
  _characterReferenceUrls?: string[]
): Promise<{ videoUrl: string; videoUrls: string[] }> {
  fal.config({ credentials: process.env.FAL_KEY });

  const videoUrls: string[] = [];
  let previousEndFrameUrl: string | undefined;

  for (let i = 0; i < Math.min(shots.length, 6); i++) {
    const shot = shots[i];

    const input: Record<string, unknown> = {
      prompt: shot.prompt,
      image_url: shot.imageUrl,
      duration: shot.duration,
      aspect_ratio: '16:9',
      cfg_scale: 0.5,
      motion_bucket_id: 80,
    };

    // Chain: use previous scene's end frame as start reference
    if (previousEndFrameUrl) {
      input.start_image_url = previousEndFrameUrl;
    }

    const result = await fal.subscribe('fal-ai/kling-video/v1.6/pro/image-to-video', {
      input: input as Parameters<typeof fal.subscribe>[1]['input'],
      logs: false,
    });

    const output = result.data as Record<string, unknown>;
    const videoData = output.video as { url?: string } | string | undefined;
    const videoUrl = typeof videoData === 'string' ? videoData : videoData?.url;
    if (videoUrl) {
      videoUrls.push(videoUrl);
    }

    // Use this shot's image as the continuity reference for the next shot
    previousEndFrameUrl = shot.imageUrl;
  }

  return {
    videoUrl: videoUrls[videoUrls.length - 1] || '',
    videoUrls,
  };
}
