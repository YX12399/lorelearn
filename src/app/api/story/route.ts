import { NextRequest, NextResponse } from 'next/server';
import { generateEpisode } from '@/lib/story-generator';
import { StoryGenerationRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: StoryGenerationRequest = await request.json();
    const { profile } = body;

    if (!profile || !profile.name || !profile.learningTopic) {
      return NextResponse.json({ error: 'Profile with name and learningTopic required' }, { status: 400 });
    }

    const episode = await generateEpisode(profile);
    return NextResponse.json({ episode });
  } catch (error) {
    console.error('Story generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Story generation failed' },
      { status: 500 }
    );
  }
}
