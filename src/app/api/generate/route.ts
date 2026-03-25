import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { put } from '@vercel/blob';

export const maxDuration = 300; // 5 minutes for video generation

// Veo 3 only accepts 4, 6, or 8 second durations
const VALID_DURATIONS = [4, 6, 8];

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

    // Clamp to nearest valid Veo 3 duration (4, 6, or 8)
    const rawDur = Number(duration) || 8;
    const durationSec = VALID_DURATIONS.includes(rawDur) ? rawDur : 8;

    console.log('[Generate] Starting Veo 3 video generation...');
    console.log('[Generate] Prompt:', prompt.slice(0, 200));
    console.log('[Generate] Duration:', durationSec, 'Aspect:', aspectRatio || '16:9');

    // Submit video generation
    let operation = await ai.models.generateVideos({
      model: 'veo-3.0-generate-001',
      prompt,
      config: {
        numberOfVideos: 1,
        durationSeconds: durationSec,
        aspectRatio: aspectRatio || '16:9',
      },
    });

    console.log('[Generate] Submitted. Operation name:', operation.name);

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
      console.error('[Generate] Operation error:', JSON.stringify(operation.error));
      return NextResponse.json({ error: 'Veo 3 returned an error', details: operation.error }, { status: 500 });
    }

    // Debug: log the full response structure
    const generatedVideos = operation.response?.generatedVideos;
    console.log('[Generate] Number of generated videos:', generatedVideos?.length ?? 0);

    if (!generatedVideos || generatedVideos.length === 0) {
      console.error('[Generate] No generatedVideos in response');
      console.error('[Generate] Full response keys:', JSON.stringify(Object.keys(operation.response || {})));
      return NextResponse.json({ error: 'No video in response' }, { status: 500 });
    }

    const firstVideo = generatedVideos[0];
    console.log('[Generate] First video keys:', JSON.stringify(Object.keys(firstVideo)));

    const video = firstVideo.video;
    if (!video) {
      console.error('[Generate] No .video on first generated video');
      console.error('[Generate] First video object:', JSON.stringify(firstVideo).slice(0, 500));
      return NextResponse.json({ error: 'No video data in response' }, { status: 500 });
    }

    console.log('[Generate] Video object keys:', JSON.stringify(Object.keys(video)));
    console.log('[Generate] Has videoBytes:', !!video.videoBytes, 'length:', video.videoBytes ? video.videoBytes.length : 0);
    console.log('[Generate] Has uri:', !!video.uri, 'uri:', video.uri || 'none');

    // Upload to Vercel Blob for a permanent URL
    const videoId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    let videoUrl: string;

    if (video.uri) {
      // Prefer URI: download from Google and re-upload
      console.log('[Generate] Downloading from URI:', video.uri);
      const resp = await fetch(video.uri);
      console.log('[Generate] Download status:', resp.status, 'content-type:', resp.headers.get('content-type'));
      const buf = await resp.arrayBuffer();
      console.log('[Generate] Downloaded', buf.byteLength, 'bytes');

      if (buf.byteLength < 1000) {
        console.error('[Generate] Video too small, likely invalid');
        return NextResponse.json({ error: 'Downloaded video is too small/invalid' }, { status: 500 });
      }

      const blob = await put(`videos/${videoId}.mp4`, Buffer.from(buf), {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'video/mp4',
      });
      videoUrl = blob.url;
    } else if (video.videoBytes) {
      const buffer = Buffer.from(video.videoBytes, 'base64');
      console.log('[Generate] Uploading videoBytes:', buffer.byteLength, 'bytes');

      if (buffer.byteLength < 1000) {
        console.error('[Generate] Video too small, likely invalid');
        return NextResponse.json({ error: 'Video data is too small/invalid' }, { status: 500 });
      }

      const blob = await put(`videos/${videoId}.mp4`, buffer, {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'video/mp4',
      });
      videoUrl = blob.url;
    } else {
      console.error('[Generate] No videoBytes or uri available');
      return NextResponse.json({ error: 'No video data returned' }, { status: 500 });
    }

    console.log('[Generate] Done! Video URL:', videoUrl);
    return NextResponse.json({ videoUrl });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Video generation failed';
    console.error('[Generate API] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
