import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const EPISODES_DIR = '/tmp/episodes';

async function ensureEpisodesDir() {
  try {
    await fs.mkdir(EPISODES_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create episodes directory:', error);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: episodeId } = await params;
    const episodeFile = path.join(EPISODES_DIR, episodeId + '.json');

    const fileContent = await fs.readFile(episodeFile, 'utf-8');
    const episode = JSON.parse(fileContent);

    return NextResponse.json(episode);
  } catch (error) {
    console.error('[Episodes API] Error reading episode:', error);
    return NextResponse.json(
      { error: 'Episode not found' },
      { status: 404 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: episodeId } = await params;
    const episode = await request.json();

    await ensureEpisodesDir();

    const episodeFile = path.join(EPISODES_DIR, episodeId + '.json');
    await fs.writeFile(episodeFile, JSON.stringify(episode, null, 2));

    return NextResponse.json({ success: true, episodeId });
  } catch (error) {
    console.error('[Episodes API] Error saving episode:', error);
    return NextResponse.json(
      { error: 'Failed to save episode' },
      { status: 500 }
    );
  }
}
