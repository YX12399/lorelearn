import { GoogleGenAI } from '@google/genai';

let ai: GoogleGenAI | null = null;
function getClient() {
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });
  }
  return ai;
}

const VIDEO_MODEL = 'veo-3-generate-preview';

// In-memory store for async video jobs (maps requestId → job state)
const videoJobs = new Map<string, {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  videoUrl?: string;
  error?: string;
}>();

/**
 * Submit a Veo 3 video generation job.
 * Veo 3 generates video WITH native audio (character speech, SFX, ambience).
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
  const requestId = `google-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // Mark as in progress
  videoJobs.set(requestId, { status: 'IN_PROGRESS' });

  // Fire and forget — run in background
  generateAsync(requestId, imageUrl, prompt, options).catch((err) => {
    console.error('Veo 3 async error:', err);
    videoJobs.set(requestId, { status: 'FAILED', error: String(err) });
  });

  return { requestId };
}

async function generateAsync(
  requestId: string,
  imageUrl: string,
  prompt: string,
  options: { duration?: number; enableAudio?: boolean }
) {
  const client = getClient();

  const videoPrompt = buildVideoPrompt(prompt);

  // Veo 3 with native audio — generates dialogue, SFX, and ambience
  const response = await client.models.generateContent({
    model: VIDEO_MODEL,
    contents: [{
      role: 'user',
      parts: [{ text: videoPrompt }],
    }],
    config: {
      responseModalities: ['VIDEO'],
    },
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part.inlineData?.mimeType?.startsWith('video/')) {
      const dataUri = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      videoJobs.set(requestId, { status: 'COMPLETED', videoUrl: dataUri });
      return;
    }
  }

  videoJobs.set(requestId, { status: 'FAILED', error: 'No video in response' });
}

/**
 * Check status of a queued video generation job.
 */
export async function checkVideoStatus(
  requestId: string
): Promise<{ status: string; videoUrl?: string }> {
  const job = videoJobs.get(requestId);
  if (!job) {
    return { status: 'FAILED' };
  }
  return { status: job.status, videoUrl: job.videoUrl };
}

/**
 * Blocking video generation.
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
  const client = getClient();
  const videoPrompt = buildVideoPrompt(prompt);

  const response = await client.models.generateContent({
    model: VIDEO_MODEL,
    contents: [{
      role: 'user',
      parts: [{ text: videoPrompt }],
    }],
    config: {
      responseModalities: ['VIDEO'],
    },
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part.inlineData?.mimeType?.startsWith('video/')) {
      const dataUri = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      return { videoUrl: dataUri, endFrameUrl: imageUrl };
    }
  }

  throw new Error('No video returned from Veo 3');
}

/**
 * Submit multiple scene videos in parallel.
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

function buildVideoPrompt(prompt: string): string {
  return [
    prompt,
    'Cinematic smooth fluid animation, professional production quality.',
    'Beautiful detailed lighting with soft volumetric rays and rich color grading.',
    'Gentle natural camera motion, no abrupt cuts or flashing.',
    'Include natural ambient sound effects and gentle background music.',
    'Characters should speak their dialogue naturally with expressive voices.',
  ].join(' ');
}
