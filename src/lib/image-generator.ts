import { fal } from '@fal-ai/client';

/**
 * Generate a scene image with strong style consistency.
 *
 * @param prompt      - The full scene prompt (should come from buildSceneImagePrompt)
 * @param characterReferenceUrl - URL of the first scene's image for character consistency
 * @param seed        - Deterministic seed derived from deriveSceneSeed()
 * @param isFirstScene - If true, generate without reference (establishes the look)
 */
export async function generateSceneImage(
  prompt: string,
  characterReferenceUrl?: string,
  seed?: number,
  isFirstScene?: boolean
): Promise<{ imageUrl: string; seed: number }> {
  fal.config({ credentials: process.env.FAL_KEY });

  // The prompt should already include the style directive from buildSceneImagePrompt.
  // Only add a minimal suffix for the model.
  const enhancedPrompt = `${prompt}. High quality, detailed, professional children's animation frame.`;

  const input: Record<string, unknown> = {
    prompt: enhancedPrompt,
    image_size: 'landscape_16_9',
    num_inference_steps: 30,
    guidance_scale: 7.5,
    ...(seed !== undefined && { seed }),
  };

  // For subsequent scenes, use the first scene's image as a style reference.
  // This keeps character appearance and color palette consistent.
  if (characterReferenceUrl && !isFirstScene) {
    input.image_url = characterReferenceUrl;
    input.strength = 0.55; // Enough to maintain style, not so much it copies the scene
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
