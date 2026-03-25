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

    const generatedVideos = operation.response?.generatedVideos;
    console.log('[Generate] Generated videos count:', generatedVideos?.length ?? 0);

    if (!generatedVideos || generatedVideos.length === 0) {
      console.error('[Generate] No generatedVideos in response. Keys:', JSON.stringify(Object.keys(operation.response || {})));
      return NextResponse.json({ error: 'No video in response' }, { status: 500 });
    }

    const firstVideo = generatedVideos[0];
    const video = firstVideo.video;

    if (!video) {
      console.error('[Generate] No .video property. Keys:', JSON.stringify(Object.keys(firstVideo)));
      return NextResponse.json({ error: 'No video data in response' }, { status: 500 });
    }

    console.log('[Generate] Video keys:', JSON.stringify(Object.keys(video)));
    console.log('[Generate] videoBytes type:', typeof video.videoBytes);
    console.log('[Generate] videoBytes length:', video.videoBytes ? (typeof video.videoBytes === 'string' ? video.videoBytes.length : (video.videoBytes as Uint8Array).byteLength) : 0);
    console.log('[Generate] uri:', video.uri || 'none');

    const videoId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    let videoUrl: string;

    if (video.uri) {
      // Prefer URI: download the actual video file from Google
      console.log('[Generate] Downloading from URI...');
      const resp = await fetch(video.uri);
      const contentType = resp.headers.get('content-type') || 'video/mp4';
      console.log('[Generate] Response status:', resp.status, 'content-type:', contentType);
      const buf = await resp.arrayBuffer();
      console.log('[Generate] Downloaded', buf.byteLength, 'bytes');

      if (buf.byteLength < 1000) {
        return NextResponse.json({ error: `Video download too small: ${buf.byteLength} bytes` }, { status: 500 });
      }

      // Use the actual content type from Google
      const ext = contentType.includes('webm') ? 'webm' : 'mp4';
      const blob = await put(`videos/${videoId}.${ext}`, Buffer.from(buf), {
        access: 'public',
        addRandomSuffix: false,
        contentType,
      });
      videoUrl = blob.url;
    } else if (video.videoBytes) {
      // videoBytes could be base64 string OR Uint8Array depending on SDK version
      let buffer: Buffer;
      if (typeof video.videoBytes === 'string') {
        console.log('[Generate] videoBytes is base64 string, decoding...');
        buffer = Buffer.from(video.videoBytes, 'base64');
      } else {
        // Already binary (Uint8Array or Buffer)
        console.log('[Generate] videoBytes is binary, wrapping...');
        buffer = Buffer.from(video.videoBytes as Uint8Array);
      }

      console.log('[Generate] Final buffer size:', buffer.byteLength);

      if (buffer.byteLength < 1000) {
        return NextResponse.json({ error: `Video data too small: ${buffer.byteLength} bytes` }, { status: 500 });
      }

      // Detect format from magic bytes
      const isWebm = buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3;
      const isMp4 = buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70;
      const ext = isWebm ? 'webm' : 'mp4';
      const contentType = isWebm ? 'video/webm' : 'video/mp4';
      console.log('[Generate] Detected format: isWebm=', isWebm, 'isMp4=', isMp4, '-> using', ext);

      const blob = await put(`videos/${videoId}.${ext}`, buffer, {
        access: 'public',
        addRandomSuffix: false,
        contentType,
      });
      videoUrl = blob.url;
    } else {
      return NextResponse.json({ error: 'No video data (no uri or videoBytes)' }, { status: 500 });
    }

    console.log('[Generate] Done! Video URL:', videoUrl);
    return NextResponse.json({ videoUrl });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Video generation failed';
    console.error('[Generate API] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
