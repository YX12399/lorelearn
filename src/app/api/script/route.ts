import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { concept, style, duration } = await req.json();

    if (!concept) {
      return NextResponse.json({ error: 'concept is required' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    const durationSec = duration || 8;
    const videoStyle = style || 'cinematic';

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: `You are a video script writer for AI video generation. Given a concept to explain, write a concise video prompt that will produce a clear, visually engaging explainer video.

Your output must be valid JSON with exactly two fields:
{
  "narration": "A short narration script (2-4 sentences) that explains the concept clearly. This is what a voiceover would say.",
  "videoPrompt": "A detailed visual description for an AI video generator. Describe what should be shown on screen moment by moment. Include camera movements, visual metaphors, colors, and style. Must be suitable for a ${durationSec}-second ${videoStyle} video. Do NOT include any text or words in the video."
}

Rules:
- The narration should be educational and engaging
- The video prompt should be rich in visual detail but achievable by AI video generation
- Style: ${videoStyle}
- Duration: ${durationSec} seconds
- No text/words/letters in the video itself
- Focus on visual metaphors and animations to explain the concept`,
      messages: [{
        role: 'user',
        content: `Write a video script explaining this concept: ${concept}`,
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    // Parse JSON from response
    let jsonStr = text;
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) jsonStr = match[1].trim();

    const script = JSON.parse(jsonStr);

    if (!script.narration || !script.videoPrompt) {
      return NextResponse.json({ error: 'Invalid script format' }, { status: 500 });
    }

    return NextResponse.json(script);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Script generation failed';
    console.error('[Script API]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
