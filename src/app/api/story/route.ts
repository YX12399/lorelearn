import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { topic, age } = await req.json();

    if (!topic || !age) {
      return NextResponse.json({ error: 'topic and age are required' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    const systemPrompt = `You are a brilliant children's educator who creates engaging, age-appropriate learning journeys. You break complex topics into prerequisite concepts that build understanding step by step.

Your task: Create a 5-scene educational episode for a ${age}-year-old about "${topic}".

CRITICAL: Plan a LEARNING JOURNEY, not just a lecture. Break the topic into prerequisite concepts.
For example, "why is the sky blue" should be:
  Scene 1: What is light? (sunlight is made of many colors mixed together)
  Scene 2: Colors are waves (different colors = different sized waves, like ocean waves)  
  Scene 3: What happens when light hits air? (tiny bits in air bump into light waves)
  Scene 4: Why blue wins (small blue waves bounce around the most — called scattering)
  Scene 5: The aha moment! (so the sky looks blue because blue light bounces everywhere!)

Each scene should feel like a mini-discovery that makes the next scene make sense.

Respond ONLY with valid JSON matching this exact structure:
{
  "title": "An engaging episode title",
  "scenes": [
    {
      "title": "Scene title",
      "narration": "What a narrator would say, 2-3 sentences, warm and curious tone, age-appropriate vocabulary. Use questions and excitement.",
      "visualPrompt": "Detailed image description: what to show visually. Be specific about colors, composition, style. Always describe a vibrant, colorful children's illustration style.",
      "duration": 8
    }
  ]
}

Rules:
- Exactly 5 scenes
- Each narration: 2-3 sentences, warm and excited, uses "you" and "we"
- Each visualPrompt: vivid, specific, child-friendly illustration description (NO text in images)
- Duration: 6-10 seconds per scene
- Build understanding step by step — each scene is a building block
- Make the last scene a satisfying "aha!" moment that ties it all together`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: `Create a learning episode about: ${topic}\nChild's age: ${age}` }],
      system: systemPrompt,
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);

    // Validate structure
    if (!parsed.title || !Array.isArray(parsed.scenes) || parsed.scenes.length !== 5) {
      return NextResponse.json({ error: 'Invalid story structure from AI' }, { status: 500 });
    }

    for (const scene of parsed.scenes) {
      if (!scene.title || !scene.narration || !scene.visualPrompt) {
        return NextResponse.json({ error: 'Scene missing required fields' }, { status: 500 });
      }
      scene.duration = scene.duration || 8;
    }

    return NextResponse.json({
      title: parsed.title,
      scenes: parsed.scenes,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Story generation failed';
    console.error('[Story API]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
