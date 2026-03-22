import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

const BUCKET = 'episode-assets';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      episodeId: string;
      sceneId: string;
      audioDataUrl: string; // data:audio/mpeg;base64,...
    };

    const { episodeId, sceneId, audioDataUrl } = body;

    if (!episodeId || !sceneId || !audioDataUrl) {
      return NextResponse.json(
        { error: 'episodeId, sceneId, and audioDataUrl are required' },
        { status: 400 }
      );
    }

    if (!audioDataUrl.startsWith('data:audio/')) {
      // Already a URL — return as-is
      return NextResponse.json({ audioUrl: audioDataUrl });
    }

    // Strip the data URI prefix and decode to buffer
    const base64 = audioDataUrl.replace(/^data:audio\/[^;]+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');

    const storagePath = `episodes/${episodeId}/${sceneId}.mp3`;

    const { error } = await getAdminClient().storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    if (error) {
      console.error('Storage upload error:', error);
      // Fall back: return the original data URL so playback still works this session
      return NextResponse.json({ audioUrl: audioDataUrl });
    }

    // Generate a long-lived signed URL (1 year)
    const { data: signedUrlData, error: signedUrlError } = await getAdminClient().storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 60 * 60 * 24 * 365);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      return NextResponse.json({ audioUrl: audioDataUrl });
    }

    return NextResponse.json({ audioUrl: signedUrlData.signedUrl });
  } catch (error) {
    console.error('Audio upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Audio upload failed' },
      { status: 500 }
    );
  }
}
