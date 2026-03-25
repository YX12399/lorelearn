import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { put } from '@vercel/blob';

export const maxDuration = 300; // 5 minutes for video generation

export async function POST(req: NextRequest) {
  try {
    const { prompt, duration, aspectRatio } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GOOGLE_API_KEY not set' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const durationSec = duration || 8;

    console.log('[Generate] Starting Veo 3 video generation...');
    console.log('[Generate] Prompt:', prompt.slice(0, 100) + '...');
    console.log('[Generate] Duration:', durationSec, 'Aspect:', aspectRatio || '16:9');

    // Submit video generation
    let operation = await ai.models.generateVideos({
      model: 'veo-3-generate-preview',
      prompt,
      config: {
        numberOfVideos: 1,
        durationSeconds: durationSec,
        aspectRatio: aspectRatio || '16:9',
      },
    });

    console.log('[Generate] Submitted. Polling for completion...');

    // Poll until done (timeout at 4.5 min to leave buffer)
    const deadline = Date.now() + 270_000;

    while (!operation.done) {
      if (Date.now() > deadline) {
        return NextResponse.json({ error: 'Video generation timed out (>4.5 min)' }, { status: 504 });
      }
      await new Promise(r => setTimeout(r, 10_000));
      operation = await ai.operations.getVideosOperation({ operation });
      console.log('[Generate] Polling... done:', operation.done);
    }

    if (operation.error) {
      console.error('[Generate] Error:', JSON.stringify(operation.error));
      return NextResponse.json({ error: 'Veo 3 returned an error', details: operation.error }, { status: 500 });
    }

    const video = operation.response?.generatedVideos?.[0]?.video;
    if (!video) {
      return NextResponse.json({ error: 'No video in response' }, { status: 500 });
    }

    // Upload to Vercel Blob for a permanent URL
    const videoId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    let videoUrl: string;

    if (video.videoBytes) {
      const buffer = Buffer.from(video.videoBytes, 'base64');
      console.log('[Generate] Uploading', buffer.byteLength, 'bytes to Blob...');
      const blob = await put(`videos/${videoId}.mp4`, buffer, {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'video/mp4',
      });
      videoUrl = blob.url;
    } else if (video.uri) {
      // Download from Google and re-upload
      const resp = await fetch(video.uri);
      const buf = await resp.arrayBuffer();
      const blob = await put(`videos/${videoId}.mp4`, Buffer.from(buf), {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'video/mp4',
      });
      videoUrl = blob.url;
    } else {
      return NextResponse.json({ error: 'No video data returned' }, { status: 500 });
    }

    console.log('[Generate] Done!', videoUrl);
    return NextResponse.json({ videoUrl });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Video generation failed';
    console.error('[Generate API]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
