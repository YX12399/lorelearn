import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export const maxDuration = 30;

const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Rachel - warm, friendly

export async function POST(req: NextRequest) {
  try {
    const { text, episodeId, sceneIndex } = await req.json();

    if (!text || !episodeId || sceneIndex === undefined) {
      return NextResponse.json({ error: 'text, episodeId, sceneIndex required' }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ELEVENLABS_API_KEY not configured' }, { status: 500 });
    }

    // Call ElevenLabs REST API directly
    const ttsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.75,
            similarity_boost: 0.75,
            style: 0.4,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!ttsResponse.ok) {
      const errText = await ttsResponse.text();
      console.error('[Voice] ElevenLabs error:', ttsResponse.status, errText);
      return NextResponse.json({ error: `ElevenLabs error: ${ttsResponse.status}` }, { status: 500 });
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    
    // Estimate duration: MP3 at ~128kbps
    const durationEstimate = Math.max(2, (audioBuffer.byteLength * 8) / 128000);

    // Upload to Vercel Blob
    let audioUrl: string;
    try {
      const blob = await put(
        `audio/${episodeId}-scene${sceneIndex}.mp3`,
        Buffer.from(audioBuffer),
        { access: 'public', addRandomSuffix: false, contentType: 'audio/mpeg' }
      );
      audioUrl = blob.url;
    } catch (blobErr) {
      console.warn('[Voice] Blob upload failed, returning base64');
      // Fallback to base64 data URL
      const base64 = Buffer.from(audioBuffer).toString('base64');
      audioUrl = `data:audio/mpeg;base64,${base64}`;
    }

    return NextResponse.json({ audioUrl, duration: durationEstimate });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Voice generation failed';
    console.error('[Voice API]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
