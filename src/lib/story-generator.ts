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

/**
 * Build a prompt that treats Claude as a cinematic scene director.
 * The output is optimized for AI video generation — rich visual descriptions,
 * camera directions, lighting, and motion cues rather than storybook prose.
 */
function buildSceneDirectorPrompt(profile: ChildProfile): string {
  const { name, age, interests, learningTopic, avatar, sensoryPreferences } = profile;

  // Build character description once — used as visual anchor
  const characterDesc = [
    `A ${age}-year-old child with ${avatar.hairColor} ${avatar.hairStyle} hair`,
    `${avatar.skinTone} skin, ${avatar.eyeColor} eyes`,
    `wearing ${avatar.favoriteOutfit}`,
  ].join(', ');

  return `You are a CINEMATIC SCENE DIRECTOR creating an animated explainer video about "${learningTopic}" for a child named ${name}.

YOUR ROLE: Plan 5 scenes for a beautifully animated educational video. Each scene will be:
1. Rendered as a HIGH-QUALITY AI-generated image (FLUX model)
2. Animated into a 5-second video clip (Wan 2.1 model)
3. Overlaid with voice narration (ElevenLabs)
4. Stitched together into one cohesive explainer video

CHILD'S CHARACTER (appears in EVERY scene):
${characterDesc}

CHILD'S WORLD (weave these into the visuals):
- Favorite animals: ${interests.animals.join(', ')}
- Favorite colors: ${interests.colors.join(', ')}
- Special interests: ${interests.specialInterests.join(', ')}
- Favorite places: ${interests.places.join(', ')}

PACING: ${sensoryPreferences.preferredPace} pace, ${sensoryPreferences.audioSensitivity} audio sensitivity

---

CRITICAL RULES FOR visualPrompt (this is what generates the actual video):

1. EVERY visualPrompt MUST start with the EXACT character description: "${characterDesc}"
2. Describe the scene as a SINGLE FROZEN MOMENT — one camera angle, one action
3. Include: lighting direction, color palette, depth of field, atmosphere
4. Include: character pose, expression, what they're doing with their hands
5. Include: background details, environmental storytelling
6. Include: motion cues for video animation (e.g., "wind gently blowing hair", "particles floating upward", "water rippling")
7. Art style MUST be: "Studio Ghibli inspired, lush detailed backgrounds, warm cinematic lighting, soft watercolor textures, 16:9 widescreen composition"
8. Each prompt must be SELF-CONTAINED — never reference other scenes
9. Keep prompts under 200 words but RICH in visual detail

RULES FOR narration (the voiceover that plays OVER the video):
1. Narration should EXPLAIN the topic, not narrate actions
2. Write as an enthusiastic, warm educator — like the best science YouTuber for kids
3. 2-3 sentences per scene. Clear, engaging, builds understanding progressively
4. Use ${name}'s name to keep it personal
5. Imagine David Attenborough explaining to a child — that tone

RULES FOR animationDirection (guides the video model):
1. Describe what MOVES in the scene — character gestures, environmental motion
2. Keep motion gentle and purposeful — no rapid camera moves
3. Examples: "Character slowly turns head and points upward", "Leaves drift across frame", "Soft glow pulses from the diagram"

EPISODE STRUCTURE:
- Scene 1: WONDER — Open with ${name} encountering something amazing about ${learningTopic}. Hook them visually.
- Scene 2: FOUNDATIONS — Explain the first core concept. Show it happening.
- Scene 3: DEEP DIVE — The most important concept. Rich visual metaphor.
- Scene 4: CONNECTION — How this connects to ${name}'s world and interests.
- Scene 5: REVELATION — The "wow" moment. ${name} understands and it's beautiful.

Respond ONLY with valid JSON:
{
  "title": "Compelling episode title",
  "learningObjective": "One clear sentence: what ${name} will understand after watching",
  "scenes": [
    {
      "index": 0,
      "title": "Scene title",
      "narration": "Voiceover narration — educational, warm, 2-3 sentences explaining the concept",
      "dialogue": [],
      "emotionBeat": {
        "primaryEmotion": "wonder",
        "zone": "green",
        "intensity": 6,
        "teachingMoment": "Brief emotional insight"
      },
      "visualPrompt": "FULL cinematic visual description starting with character, then environment, lighting, composition, motion cues, art style. 150-200 words of pure visual detail.",
      "animationDirection": "What moves in the scene and how — gentle motion guidance for video generation",
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
      animationDirection: s.animationDirection || '',
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
