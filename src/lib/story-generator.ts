import Anthropic from '@anthropic-ai/sdk';
import { ChildProfile, Episode, Scene } from '@/types';
import { buildContinuityBible } from './cohesion';

export async function generateEpisode(profile: ChildProfile): Promise<Episode> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
  const prompt = buildSceneDirectorPrompt(profile);

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude');

  return parseEpisodeResponse(content.text, profile);
}

function buildSceneDirectorPrompt(profile: ChildProfile): string {
  const { name, age, interests, learningTopic, avatar, sensoryPreferences } = profile;

  const characterDesc = [
    `A ${age}-year-old child with ${avatar.hairColor} ${avatar.hairStyle} hair`,
    `${avatar.skinTone} skin, ${avatar.eyeColor} eyes`,
    `wearing ${avatar.favoriteOutfit}`,
  ].join(', ');

  return `You are a cinematic scene director creating an animated educational video about "${learningTopic}" for ${name}, age ${age}.

YOUR TASK: Plan 5 scenes for a beautiful animated explainer video. Each scene will be:
1. Rendered as a high-quality AI image
2. Animated into a 5–10 second video clip
3. Overlaid with warm voice narration
4. Played sequentially as a cohesive learning experience

THE CHILD (appears in every scene):
${characterDesc}

THEIR WORLD (weave naturally into the visuals):
- Animals they love: ${interests.animals.join(', ') || 'various animals'}
- Favorite colors: ${interests.colors.join(', ') || 'bright colors'}
- Special interests: ${interests.specialInterests.join(', ') || 'exploring and learning'}
- Favorite places: ${interests.places.join(', ') || 'outdoors'}

PACING: ${sensoryPreferences.preferredPace} · Audio sensitivity: ${sensoryPreferences.audioSensitivity}

VISUAL PROMPT RULES (critical — this text generates the actual image):
1. EVERY visualPrompt MUST begin with: "${characterDesc}"
2. Describe ONE frozen moment — single camera angle, single action
3. Include: lighting, color palette, depth of field, atmosphere
4. Include: character pose, expression, hand position
5. Include: background details and environmental storytelling
6. Include: subtle motion cues (wind in hair, floating particles, rippling water)
7. End every prompt with: "Studio Ghibli inspired, lush painted backgrounds, warm cinematic lighting, soft watercolor textures, 16:9 widescreen, masterpiece quality."
8. Each prompt is SELF-CONTAINED — never reference other scenes
9. 120–180 words of pure visual detail

NARRATION RULES (warm voiceover explaining the topic):
1. Explain the science/concept — don't describe actions
2. Write as a warm, enthusiastic educator — like the best science show host for kids
3. 2–3 sentences per scene, building understanding progressively
4. Use ${name}'s name to keep it personal
5. Match the ${sensoryPreferences.preferredPace} pacing preference

ANIMATION DIRECTION (guides how the image becomes video):
1. Describe what MOVES: character gestures, environmental motion
2. Keep motion gentle and purposeful
3. Examples: "Character slowly looks up in wonder", "Leaves drift gently across frame"

EPISODE ARC:
- Scene 1 WONDER: ${name} encounters something amazing about ${learningTopic}
- Scene 2 FOUNDATIONS: Explain the first core concept visually
- Scene 3 DEEP DIVE: The key concept with a rich visual metaphor
- Scene 4 CONNECTION: How this relates to ${name}'s world and interests
- Scene 5 REVELATION: The "aha!" moment — ${name} understands and it's beautiful

Respond with ONLY valid JSON (no markdown, no code fences):
{
  "title": "Engaging episode title",
  "learningObjective": "One sentence: what ${name} will understand",
  "scenes": [
    {
      "index": 0,
      "title": "Scene title",
      "narration": "Educational voiceover, 2-3 sentences",
      "dialogue": [],
      "emotionBeat": {
        "primaryEmotion": "wonder",
        "zone": "green",
        "intensity": 6,
        "teachingMoment": "Brief emotional insight"
      },
      "visualPrompt": "Full cinematic description starting with character...",
      "animationDirection": "What moves and how",
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
  const episodeId = `episode-${Date.now()}`;

  const scenes: Scene[] = data.scenes.map(
    (s: Record<string, unknown>, index: number) => ({
      id: `scene-${index}`,
      index,
      title: s.title,
      narration: s.narration,
      dialogue: s.dialogue || [],
      emotionBeat: s.emotionBeat,
      visualPrompt: s.visualPrompt,
      animationDirection: (s.animationDirection as string) || '',
      interactiveMoment: s.interactiveMoment || undefined,
      duration: (s.duration as number) || 8,
      transitionType: s.transitionType || 'crossfade',
    })
  );

  const episode: Episode = {
    id: episodeId,
    childProfile: profile,
    title: data.title,
    learningObjective: data.learningObjective,
    scenes,
    createdAt: new Date().toISOString(),
    status: 'planning',
    continuityBible: buildContinuityBible(scenes, profile, undefined, episodeId),
  };

  return episode;
}
