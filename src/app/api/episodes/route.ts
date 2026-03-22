import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { saveEpisode } from '@/lib/supabase/db/episodes';
import type { Episode } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as { episode: Episode; childProfileId?: string };
    const { episode, childProfileId } = body;

    if (!episode?.id) {
      return NextResponse.json({ error: 'episode.id is required' }, { status: 400 });
    }

    const saved = await saveEpisode(
      episode,
      childProfileId ?? episode.childProfile.id,
      user.id
    );

    return NextResponse.json({ episode: saved });
  } catch (error) {
    console.error('Save episode error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save episode' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const childProfileId = searchParams.get('childProfileId') ?? undefined;

    const { getEpisodes } = await import('@/lib/supabase/db/episodes');
    const episodes = await getEpisodes(childProfileId);
    return NextResponse.json({ episodes });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch episodes' },
      { status: 500 }
    );
  }
}
