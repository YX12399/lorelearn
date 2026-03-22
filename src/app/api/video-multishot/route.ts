import { NextRequest, NextResponse } from 'next/server';
import { generateMultiShotVideo } from '@/lib/video-generator';
import { MultiShotVideoRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: MultiShotVideoRequest = await request.json();
    const { shots, characterReferenceUrls } = body;

    if (!shots || shots.length === 0) {
      return NextResponse.json({ error: 'At least one shot required' }, { status: 400 });
    }

    if (shots.length > 6) {
      return NextResponse.json({ error: 'Maximum 6 shots allowed' }, { status: 400 });
    }

    const result = await generateMultiShotVideo(shots, characterReferenceUrls);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Multi-shot video generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Multi-shot video generation failed' },
      { status: 500 }
    );
  }
}
