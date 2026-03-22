import { fal } from '@fal-ai/client';

fal.config({
  credentials: process.env.FAL_KEY,
});

export async function generateSceneImage(
  prompt: string,
  characterReferenceUrl?: string,
  seed?: number
): Promise<{ imageUrl: string; seed: number }> {
  const enhancedPrompt = `${prompt}. Children's animated TV show style, 2D animation, soft warm colors, child-friendly, high quality, detailed backgrounds, expressive character.`;

  const input: Record<string, unknown> = {
    prompt: enhancedPrompt,
    image_size: 'landscape_16_9',
    num_inference_steps: 28,
    guidance_scale: 7.5,
    ...(seed !== undefined && { seed }),
  };

  if (characterReferenceUrl) {
    input.reference_image_url = characterReferenceUrl;
    input.reference_strength = 0.85;
  }

  const result = await fal.subscribe('fal-ai/flux/dev', {
    input: input as Parameters<typeof fal.subscribe>[1]['input'],
    logs: false,
  });

  const output = result.data as Record<string, unknown>;
  const images = (output.images as unknown[]) || (output.image ? [output.image] : []);

  if (!images || images.length === 0) {
    throw new Error('No images returned from fal.ai');
  }

  const firstImage = images[0] as { url?: string } | string;
  const imageUrl = typeof firstImage === 'string' ? firstImage : firstImage.url || '';

  return {
    imageUrl,
    seed: (output.seed as number) || seed || Math.floor(Math.random() * 1000000),
  };
}
