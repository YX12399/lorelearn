import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';

fal.config({
  credentials: process.env.FAL_KEY,
});

interface CharacterRequest {
  characterDescription: string;
  artStyle?: string;
  childName: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CharacterRequest;
    const { characterDescription, artStyle, childName } = body;

    if (!characterDescription || !childName) {
      return NextResponse.json(
        { error: 'characterDescription and childName are required' },
        { status: 400 }
      );
    }

    const style = artStyle ?? 'warm, friendly, soft watercolor illustration style, suitable for children';

    // Generate a character reference sheet — multiple poses on white background
    const referencePrompt = [
      `Character reference sheet for a children's animated story.`,
      `The main character: ${characterDescription}`,
      `Show the character in three poses: front view, side view, and a happy expression closeup.`,
      `White background, ${style}.`,
      `Consistent character design, no text or labels, clean illustration.`,
      `Safe for children, warm and approachable design.`,
    ].join(' ');

    const result = await fal.subscribe('fal-ai/flux/dev', {
      input: {
        prompt: referencePrompt,
        num_images: 1,
        image_size: 'landscape_4_3',
        guidance_scale: 7.5,
        num_inference_steps: 28,
      },
      logs: false,
    });

    const output = result.data as { images?: { url: string }[] };
    const imageUrl = output.images?.[0]?.url;

    if (!imageUrl) {
      return NextResponse.json({ error: 'No image returned from fal.ai' }, { status: 500 });
    }

    return NextResponse.json({
      characterReferenceUrl: imageUrl,
      characterDescription,
      childName,
    });
  } catch (error) {
    console.error('Character generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Character generation failed' },
      { status: 500 }
    );
  }
}
