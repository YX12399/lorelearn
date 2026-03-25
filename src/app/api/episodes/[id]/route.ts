import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export const maxDuration = 15;

// GET: Load episode from Vercel Blob
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Fetch directly from blob store
    const blobUrl = `https://bz2i3tmv6dixo6u6.public.blob.vercel-storage.com/episodes/${id}.json`;
    const response = await fetch(blobUrl, { cache: 'no-store' });

    if (!response.ok) {
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    }

    const episode = await response.json();
    return NextResponse.json(episode);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load episode';
    console.error('[Episodes GET]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST: Save episode to Vercel Blob
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const episode = await req.json();

    if (!episode || !episode.title || !episode.scenes) {
      return NextResponse.json({ error: 'Invalid episode data' }, { status: 400 });
    }

    // Ensure the ID is set
    episode.id = id;

    const blob = await put(
      `episodes/${id}.json`,
      JSON.stringify(episode),
      { access: 'public', addRandomSuffix: false, contentType: 'application/json' }
    );

    console.log(`[Episodes] Saved episode ${id} to blob: ${blob.url}`);
    return NextResponse.json({ url: blob.url, id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save episode';
    console.error('[Episodes POST]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
