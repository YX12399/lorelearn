import { NextRequest, NextResponse } from 'next/server';
import { uploadImageFromUrl, uploadVideoFromUrl, uploadAudioFromBase64 } from '@/lib/asset-storage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, type, episodeId, sceneIndex, base64 } = body;

    if (!url && !base64) {
      return NextResponse.json(
        { error: 'Either url or base64 must be provided' },
        { status: 400 }
      );
    }

    if (!episodeId || sceneIndex === undefined) {
      return NextResponse.json(
        { error: 'episodeId and sceneIndex are required' },
        { status: 400 }
      );
    }

    let permanentUrl = '';

    if (type === 'image' && url) {
      permanentUrl = await uploadImageFromUrl(url, episodeId, sceneIndex);
    } else if (type === 'video' && url) {
      permanentUrl = await uploadVideoFromUrl(url, episodeId, sceneIndex);
    } else if (type === 'audio' && base64) {
      permanentUrl = await uploadAudioFromBase64(base64, episodeId, sceneIndex);
    } else {
      return NextResponse.json(
        { error: 'Invalid type or missing required field' },
        { status: 400 }
      );
    }

    const resultUrl = permanentUrl || url || '';

    return NextResponse.json({
      permanentUrl: resultUrl,
      isTemporary: !permanentUrl,
    });
  } catch (error) {
    console.error('[Assets API] Error:', error);
    return NextResponse.json(
      { error: 'Asset upload failed' },
      { status: 500 }
    );
  }
}
