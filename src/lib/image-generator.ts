import { fal } from '@fal-ai/client';

fal.config({ credentials: process.env.FAL_KEY });

// Nano Banana Pro — Google's Gemini 3 Pro image model
// 4K native, reasoning-based composition, best-in-class character consistency
const IMAGE_MODEL = 'fal-ai/nano-banana-pro' as const;

/**
 * Generate a scene image using fal.ai Nano Banana Pro.
 * Uses reasoning-based generation — plans composition, lighting, and spatial
 * relationships before rendering, producing images with stronger coherence.
 */
export async function generateSceneImage(
  prompt: string,
  characterReferenceUrl?: string,
  seed?: number,
  isFirstScene?: boolean
): Promise<{ imageUrl: string; seed: number }> {
  const usedSeed = seed ?? Math.floor(Math.random() * 1_000_000);

  // Build an enriched prompt that bakes in style consistency
  let fullPrompt = prompt;
  if (characterReferenceUrl && !isFirstScene) {
    fullPrompt +=
      ' Maintain exact same character design, proportions, color palette, and art style as the reference image.';
  }

  const result = await fal.subscribe(IMAGE_MODEL, {
    input: {
      prompt: fullPrompt,
      aspect_ratio: '16:9',
      resolution: '2K',
      output_format: 'png',
    },
    logs: false,
  });

  // Nano Banana Pro returns { images: [{ url, content_type }] }
  const imageUrl = result.data.images[0]?.url;
  if (!imageUrl) {
    throw new Error('No image returned from Nano Banana Pro');
  }

  return { imageUrl, seed: usedSeed };
}
