import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { put } from '@vercel/blob';

export const maxDuration = 300; // 5 minutes for video generation

export async function POST(req: NextRequest) {
  try {
    const { prompt, episodeId, sceneIndex, imageUrl } = await req.json();

    if (!prompt || !episodeId || sceneIndex === undefined) {
      return NextResponse.json({ error: 'prompt, episodeId, sceneIndex required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GOOGLE_API_KEY not configured' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Build the video generation request
    const videoPrompt = `Children's educational animation: ${prompt}. Gentle, smooth camera movement. Bright, colorful, child-friendly illustration style. No text or words visible.`;

    console.log(`[Video] Starting Veo 3 generation for scene ${sceneIndex}...`);

    // If we have a reference image, use image-to-video
    let operation;
    if (imageUrl && !imageUrl.startsWith('data:')) {
      try {
        // Download the reference image
        const imgResponse = await fetch(imageUrl);
        const imgBuffer = await imgResponse.arrayBuffer();
        const imgBase64 = Buffer.from(imgBuffer).toString('base64');

        operation = await ai.models.generateVideos({
          model: 'veo-3-generate-preview',
          prompt: videoPrompt,
          image: {
            imageBytes: imgBase64,
            mimeType: 'image/png',
          },
          config: {
            numberOfVideos: 1,
            durationSeconds: 5,
          },
        });
      } catch (imgErr) {
        console.warn('[Video] Image-to-video failed, falling back to text-to-video:', imgErr);
        // Fall back to text-only
        operation = await ai.models.generateVideos({
          model: 'veo-3-generate-preview',
          prompt: videoPrompt,
          config: {
            numberOfVideos: 1,
            durationSeconds: 5,
          },
        });
      }
    } else {
      // Text-to-video only
      operation = await ai.models.generateVideos({
        model: 'veo-3-generate-preview',
        prompt: videoPrompt,
        config: {
          numberOfVideos: 1,
          durationSeconds: 5,
        },
      });
    }

    // Poll until done (with timeout)
    const startTime = Date.now();
    const timeoutMs = 250_000; // 4 min 10 sec (leave buffer for upload)

    while (!operation.done) {
      if (Date.now() - startTime > timeoutMs) {
        console.warn(`[Video] Timed out for scene ${sceneIndex}`);
        return NextResponse.json({ error: 'Video generation timed out', videoUrl: null }, { status: 200 });
      }
      await new Promise(resolve => setTimeout(resolve, 10_000)); // Poll every 10s
      operation = await ai.operations.getVideosOperation({ operation });
    }

    // Check for errors
    if (operation.error) {
      console.error('[Video] Generation error:', operation.error);
      return NextResponse.json({ error: 'Video generation failed', videoUrl: null }, { status: 200 });
    }

    // Extract video
    const generatedVideo = operation.response?.generatedVideos?.[0];
    const videoBytes = generatedVideo?.video?.videoBytes;
    const videoUri = generatedVideo?.video?.uri;

    if (!videoBytes && !videoUri) {
      console.error('[Video] No video in response');
      return NextResponse.json({ error: 'No video generated', videoUrl: null }, { status: 200 });
    }

    // Upload to Vercel Blob
    let videoUrl: string;
    if (videoBytes) {
      const buffer = Buffer.from(videoBytes, 'base64');
      const blob = await put(
        `videos/${episodeId}-scene${sceneIndex}.mp4`,
        buffer,
        { access: 'public', addRandomSuffix: false, contentType: 'video/mp4' }
      );
      videoUrl = blob.url;
    } else if (videoUri) {
      // Download from Google's URI and re-upload to Blob
      const videoResponse = await fetch(videoUri);
      const videoBuffer = await videoResponse.arrayBuffer();
      const blob = await put(
        `videos/${episodeId}-scene${sceneIndex}.mp4`,
        Buffer.from(videoBuffer),
        { access: 'public', addRandomSuffix: false, contentType: 'video/mp4' }
      );
      videoUrl = blob.url;
    } else {
      return NextResponse.json({ error: 'No video data', videoUrl: null }, { status: 200 });
    }

    console.log(`[Video] Scene ${sceneIndex} complete: ${videoUrl}`);
    return NextResponse.json({ videoUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Video generation failed';
    console.error('[Video API]', message);
    // Return 200 with null videoUrl so pipeline continues (slideshow fallback)
    return NextResponse.json({ error: message, videoUrl: null }, { status: 200 });
  }
}
