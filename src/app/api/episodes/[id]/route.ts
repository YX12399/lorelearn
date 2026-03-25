import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: episodeId } = await params;
    
    // Try to fetch from Blob storage
    const blobUrl = `https://bz2i3tmv6dixo6u6.public.blob.vercel-storage.com/episodes/${episodeId}.json`;
    const resp = await fetch(blobUrl, { cache: 'no-store' });
    
    if (!resp.ok) {
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    }
    
    const episode = await resp.json();
    return NextResponse.json(episode);
  } catch (error) {
    console.error('[Episodes] GET error:', error);
    return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: episodeId } = await params;
    const episode = await request.json();

    const blob = await put(`episodes/${episodeId}.json`, JSON.stringify(episode), {
      access: 'public',
      contentType: 'application/json',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
    });

    console.log(`[Episodes] Saved ${episodeId} to Blob: ${blob.url}`);
    return NextResponse.json({ success: true, episodeId, url: blob.url });
  } catch (error) {
    console.error('[Episodes] POST error:', error);
    return NextResponse.json({ error: 'Failed to save episode' }, { status: 500 });
  }
}
