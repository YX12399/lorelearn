import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { put } from '@vercel/blob';

export const maxDuration = 60;

let falConfigured = false;

function ensureFalConfig() {
  if (!falConfigured) {
    const key = process.env.FAL_KEY;
    if (!key) throw new Error('FAL_KEY not configured');
    fal.config({ credentials: key });
    falConfigured = true;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, episodeId, sceneIndex } = await req.json();

    if (!prompt || !episodeId || sceneIndex === undefined) {
      return NextResponse.json({ error: 'prompt, episodeId, sceneIndex required' }, { status: 400 });
    }

    ensureFalConfig();

    // Generate image with fal.ai Nano Banana Pro
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (fal as any).subscribe('fal-ai/nano-banana-pro', {
      input: {
        prompt: `Children's educational illustration, vibrant colorful style: ${prompt}. No text, no words, no letters in the image.`,
        image_size: 'landscape_16_9',
        num_images: 1,
      },
      logs: false,
    });

    const imageUrl = result?.data?.images?.[0]?.url;
    
    if (!imageUrl) {
      return NextResponse.json({ error: 'No image generated' }, { status: 500 });
    }

    // Upload to Vercel Blob for permanent storage
    let permanentUrl = imageUrl;
    try {
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const blob = await put(
        `images/${episodeId}-scene${sceneIndex}.png`,
        Buffer.from(imageBuffer),
        { access: 'public', addRandomSuffix: false, contentType: 'image/png' }
      );
      permanentUrl = blob.url;
    } catch (blobErr) {
      console.warn('[Images] Blob upload failed, using fal URL:', blobErr);
    }

    return NextResponse.json({ imageUrl: permanentUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Image generation failed';
    console.error('[Images API]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
