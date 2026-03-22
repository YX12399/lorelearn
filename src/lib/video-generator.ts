import { fal } from '@fal-ai/client';

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

  const videoPrompt = `${prompt} Smooth, gentle animation. Child-friendly movement. No sudden jumps or flashes. Warm, soft lighting throughout. Consistent character appearance.`;

  const input: Record<string, unknown> = {
    prompt: videoPrompt,
    image_url: imageUrl,
    duration,
    aspect_ratio: '16:9',
    cfg_scale: 0.5,
    motion_bucket_id: 100,
  };

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

  return {
    videoUrl,
  };
}

export async function generateMultiShotVideo(
  shots: Array<{ imageUrl: string; prompt: string; duration: number }>,
  _characterReferenceUrls?: string[]
): Promise<{ videoUrl: string }> {
  fal.config({ credentials: process.env.FAL_KEY });
  // Process shots sequentially, using end frame of previous as start of next
  const videoUrls: string[] = [];

  for (let i = 0; i < Math.min(shots.length, 6); i++) {
    const shot = shots[i];

    const input: Record<string, unknown> = {
      prompt: shot.prompt,
      image_url: shot.imageUrl,
      duration: shot.duration,
      aspect_ratio: '16:9',
      cfg_scale: 0.5,
    };

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
  }

  // Return the last video or stitch info
  return {
    videoUrl: videoUrls[videoUrls.length - 1] || '',
  };
}
