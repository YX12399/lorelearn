import Anthropic from '@anthropic-ai/sdk';
import { ChildProfile, Episode, Scene } from '@/types';
import { buildContinuityBible } from './cohesion';

export async function generateEpisode(profile: ChildProfile): Promise<Episode> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const prompt = buildSceneDirectorPrompt(profile);

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type');

  return parseEpisodeResponse(content.text, profile);
}

function buildSceneDirectorPrompt(profile: ChildProfile): string {
  const { name, age, interests, learningTopic, avatar, sensoryPreferences } = profile;

  const characterDesc = [
    `A ${age}-year-old child with ${avatar.hairColor} ${avatar.hairStyle} hair`,
    `${avatar.skinTone} skin, ${avatar.eyeColor} eyes`,
    `wearing ${avatar.favoriteOutfit}`,
  ].join(', ');

  return `You are a master children's educator AND cinematic scene director.

TASK: Create an animated educational video about "${learningTopic}" for ${name}, age ${age}.

CRITICAL EDUCATIONAL APPROACH:
A ${age}-year-old doesn't have background knowledge adults take for granted.
Before explaining "${learningTopic}", you MUST build up from foundational concepts.

For example:
- "Why is the sky blue?" → First explain: what is light? → light is made of colors → colors travel in waves → small things scatter short waves → blue light scatters most → that's why the sky is blue!
- "How do volcanoes erupt?" → First explain: the Earth has layers → deep inside is very hot melted rock → pressure builds up → it pushes through cracks → BOOM, volcano!
- "Why do we dream?" → First explain: your brain is always working → when you sleep it sorts memories → sometimes it plays them like movies → those movies are dreams!

Plan your 5 scenes as a LEARNING JOURNEY from zero knowledge to understanding:
- Scene 1 FOUNDATION: Introduce the most basic building-block concept (with wonder and beauty)
- Scene 2 BUILDING: Add the next layer of understanding with a vivid visual metaphor  
- Scene 3 KEY CONCEPT: The central mechanism/process, shown dramatically
- Scene 4 CONNECTION: Link it to ${name}'s world — use their interests (${interests.animals.join(', ') || 'animals'}, ${interests.specialInterests.join(', ') || 'exploring'})
- Scene 5 AHA MOMENT: The full picture clicks — ${name} now understands ${learningTopic}!

THE CHILD CHARACTER (appears in EVERY scene):
${characterDesc}

THEIR WORLD (weave naturally into visuals):
- Animals: ${interests.animals.join(', ') || 'various animals'}
- Colors: ${interests.colors.join(', ') || 'bright colors'}
- Special interests: ${interests.specialInterests.join(', ') || 'exploring'}
- Places: ${interests.places.join(', ') || 'outdoors'}

NARRATION RULES (this is a warm voiceover — NOT describing actions):
1. TEACH the concept — explain the science/how/why
2. Use simple words a ${age}-year-old would understand
3. 2-3 sentences per scene, each sentence adds understanding
4. Use ${name}'s name naturally  
5. Ask a wonder question occasionally ("Have you ever noticed...?", "Isn't that amazing?")
6. Pacing: ${sensoryPreferences.preferredPace}

VISUAL PROMPT RULES (this text generates the actual AI image):
1. EVERY prompt starts with: "${characterDesc}"
2. Describe ONE frozen cinematic moment
3. Include: character pose, expression, what they're looking at
4. Include: lighting, color palette, atmospheric effects
5. Include: background environment with educational visual metaphors
6. End EVERY prompt with: "Studio Ghibli anime style, lush painted backgrounds, warm cinematic lighting, soft watercolor textures, 16:9 widescreen, masterpiece quality, no text."
7. Each prompt is 120-180 words and SELF-CONTAINED
8. Character looks IDENTICAL across all scenes

ANIMATION DIRECTION (guides video generation):
1. What MOVES: character gestures, environmental motion, camera movement
2. Keep motion gentle, purposeful, cinematic
3. Include specific actions: "slowly reaches out", "light beams dance across"

Respond with ONLY valid JSON (no markdown fences):
{
  "title": "Engaging episode title about ${learningTopic}",
  "learningObjective": "What ${name} will understand after watching",
  "conceptJourney": ["concept 1 (foundation)", "concept 2 (building)", "concept 3 (key)", "concept 4 (connection)", "concept 5 (aha)"],
  "scenes": [
    {
      "index": 0,
      "title": "Scene title",
      "narration": "Educational voiceover, 2-3 sentences teaching a concept",
      "dialogue": [],
      "emotionBeat": {
        "primaryEmotion": "wonder",
        "zone": "green",
        "intensity": 6,
        "teachingMoment": "What concept this scene teaches"
      },
      "visualPrompt": "Full cinematic image description starting with character...",
      "animationDirection": "What moves and how in the video",
      "transitionType": "crossfade",
      "duration": 8
    }
  ]
}`;
}

function parseEpisodeResponse(text: string, profile: ChildProfile): Episode {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in Claude response');

  const data = JSON.parse(jsonMatch[0]);
  const episodeId = `ep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const scenes: Scene[] = data.scenes.map(
    (s: Record<string, unknown>, index: number) => ({
      id: `scene-${index}`,
      index,
      title: s.title,
      narration: s.narration,
      dialogue: s.dialogue || [],
      emotionBeat: s.emotionBeat,
      visualPrompt: s.visualPrompt,
      interactiveMoment: s.interactiveMoment || undefined,
      duration: (s.duration as number) || 8,
      transitionType: s.transitionType || 'crossfade',
    })
  );

  return {
    id: episodeId,
    childProfile: profile,
    title: data.title,
    learningObjective: data.learningObjective,
    scenes,
    createdAt: new Date().toISOString(),
    status: 'planning',
    continuityBible: buildContinuityBible(scenes, profile, undefined, episodeId),
  };
}
