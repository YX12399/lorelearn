import { GoogleGenAI } from '@google/genai';

let ai: GoogleGenAI | null = null;
function getClient() {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) throw new Error('GOOGLE_API_KEY not configured. Add it to Vercel environment variables.');
  if (!ai) ai = new GoogleGenAI({ apiKey: key });
  return ai;
}

/**
 * Submit a video job. For Veo 3, we run it blocking and return immediately.
 * The "requestId" is actually the Blob URL of the completed video.
 */
export async function submitVideoJob(
  imageUrl: string,
  prompt: string,
  options: { duration?: number; enableAudio?: boolean } = {}
): Promise<{ requestId: string }> {
  // For Google, we generate blocking and return the URL as "requestId"
  const result = await generateSceneVideo(imageUrl, prompt, { duration: options.duration });
  return { requestId: `COMPLETED:${result.videoUrl}` };
}

/**
 * Check status — for Google, the "requestId" contains the result.
 */
export async function checkVideoStatus(
  requestId: string
): Promise<{ status: string; videoUrl?: string }> {
  if (requestId.startsWith('COMPLETED:')) {
    return { status: 'COMPLETED', videoUrl: requestId.replace('COMPLETED:', '') };
  }
  return { status: 'FAILED', videoUrl: undefined };
}

/**
 * Blocking video generation via Veo 3.
 * Generates video from text prompt, uploads to Blob, returns persistent URL.
 */
export async function generateSceneVideo(
  imageUrl: string,
  prompt: string,
  options: { duration?: number; startFrameUrl?: string; endFrameUrl?: string; characterReferenceUrls?: string[] } = {}
): Promise<{ videoUrl: string; endFrameUrl?: string }> {
  const client = getClient();
  const videoPrompt = buildVideoPrompt(prompt);

  console.log(`[Veo3] Generating video (prompt: ${videoPrompt.slice(0, 100)}...)`);

  // Build parts — include reference image if available
  const parts: Array<Record<string, unknown>> = [{ text: videoPrompt }];

  // Try to include the reference image for visual consistency
  if (imageUrl && !imageUrl.startsWith('data:')) {
    try {
      const imgResp = await fetch(imageUrl);
      if (imgResp.ok) {
        const imgBuffer = await imgResp.arrayBuffer();
        const base64 = Buffer.from(imgBuffer).toString('base64');
        const contentType = imgResp.headers.get('content-type') || 'image/png';
        parts.unshift({
          inlineData: { mimeType: contentType, data: base64 }
        });
        parts[1] = { text: `Using the provided image as visual reference for character design and art style. ${videoPrompt}` };
      }
    } catch (err) {
      console.warn('[Veo3] Could not fetch reference image:', err);
    }
  }

  const response = await client.models.generateContent({
    model: 'veo-3-generate-preview',
    contents: [{ role: 'user', parts }],
    config: { responseModalities: ['VIDEO'] },
  });

  const responseParts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of responseParts) {
    if (part.inlineData?.mimeType?.startsWith('video/')) {
      // Upload to Blob instead of returning base64
      try {
        const { put } = await import('@vercel/blob');
        const videoBuffer = Buffer.from(part.inlineData.data!, 'base64');
        const filename = `videos/veo3_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.mp4`;
        const blob = await put(filename, videoBuffer, {
          access: 'public',
          contentType: part.inlineData.mimeType,
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        console.log(`[Veo3] Video uploaded to Blob: ${blob.url}`);
        return { videoUrl: blob.url, endFrameUrl: imageUrl };
      } catch (blobErr) {
        console.warn('[Veo3] Blob upload failed, returning data URI');
        return {
          videoUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
          endFrameUrl: imageUrl,
        };
      }
    }
  }

  throw new Error('No video returned from Veo 3. Check your Google API key has video generation access.');
}

export async function generateMultiShotVideo(
  shots: Array<{ imageUrl: string; prompt: string; duration: number }>
): Promise<{ videoUrl: string; videoUrls: string[]; requestIds: string[] }> {
  const results = await Promise.all(
    shots.slice(0, 6).map(async (shot) => {
      const { requestId } = await submitVideoJob(shot.imageUrl, shot.prompt, { duration: shot.duration });
      return requestId;
    })
  );
  return { videoUrl: '', videoUrls: [], requestIds: results };
}

function buildVideoPrompt(prompt: string): string {
  return [
    prompt,
    'Cinematic smooth fluid animation, professional production quality.',
    'Beautiful detailed lighting with soft volumetric rays and rich color grading.',
    'Gentle natural camera motion, no abrupt cuts or flashing.',
    'Subtle ambient motion: hair and cloth movement, atmospheric particles.',
  ].join(' ');
}
