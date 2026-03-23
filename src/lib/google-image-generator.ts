import { GoogleGenAI } from '@google/genai';

let ai: GoogleGenAI | null = null;
function getClient() {
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });
  }
  return ai;
}

const IMAGE_MODEL = 'gemini-3-pro-image-preview';

/**
 * Generate a scene image using Google Gemini (Nano Banana Pro).
 * Uses generateContent with responseModalities: ['IMAGE'].
 */
export async function generateSceneImage(
  prompt: string,
  characterReferenceUrl?: string,
  seed?: number,
  isFirstScene?: boolean
): Promise<{ imageUrl: string; seed: number }> {
  const usedSeed = seed ?? Math.floor(Math.random() * 1_000_000);
  const client = getClient();

  let fullPrompt = prompt;
  if (characterReferenceUrl && !isFirstScene) {
    fullPrompt +=
      ' Maintain exact same character design, proportions, color palette, and art style as the reference image.';
  }

  fullPrompt += ' Generate a high quality 16:9 landscape illustration.';

  const response = await client.models.generateContent({
    model: IMAGE_MODEL,
    contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
    config: {
      responseModalities: ['IMAGE', 'TEXT'],
    },
  });

  // Extract inline image data from response
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part.inlineData?.mimeType?.startsWith('image/')) {
      // Convert base64 to a data URI that can be used as imageUrl
      const dataUri = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      return { imageUrl: dataUri, seed: usedSeed };
    }
  }

  throw new Error('No image returned from Gemini Nano Banana Pro');
}
