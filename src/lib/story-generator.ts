import Anthropic from '@anthropic-ai/sdk';
import { ChildProfile, Episode, Scene } from '@/types';
import { buildContinuityBible } from './cohesion';

export async function generateEpisode(profile: ChildProfile): Promise<Episode> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
  const prompt = buildStoryPrompt(profile);

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude');

  const parsed = parseEpisodeResponse(content.text, profile);
  return parsed;
}

function buildStoryPrompt(profile: ChildProfile): string {
  const { name, age, interests, learningTopic, avatar, emotionalGoals, sensoryPreferences } =
    profile;

  return `You are creating a personalized educational animated episode for a child named ${name}, age ${age}.

CHILD PROFILE:
- Name: ${name}
- Age: ${age}
- Favorite animals: ${interests.animals.join(', ')}
- Favorite foods: ${interests.foods.join(', ')}
- Favorite TV shows: ${interests.tvShows.join(', ')}
- Favorite games: ${interests.games.join(', ')}
- Favorite colors: ${interests.colors.join(', ')}
- Favorite places: ${interests.places.join(', ')}
- Special interests: ${interests.specialInterests.join(', ')}
- Comfort objects: ${interests.comfortObjects.join(', ')}
- Appearance: ${avatar.hairColor} ${avatar.hairStyle} hair, ${avatar.skinTone} skin, ${avatar.eyeColor} eyes, wears ${avatar.favoriteOutfit}
- Emotional goals: ${emotionalGoals.join(', ')}
- Sensory: prefers ${sensoryPreferences.preferredPace} pace, ${sensoryPreferences.audioSensitivity} audio sensitivity

LEARNING TOPIC: ${learningTopic}

Create a 5-scene personalized animated episode where ${name} IS THE PROTAGONIST going on a learning adventure. The episode should teach about ${learningTopic} through an engaging story that uses ${name}'s personal interests as the world and context.

CRITICAL VISUAL CONTINUITY RULES — each scene's visualPrompt must:
1. Begin with the EXACT same character description: "${avatar.hairColor} ${avatar.hairStyle} hair, ${avatar.skinTone} skin, ${avatar.eyeColor} eyes, wearing ${avatar.favoriteOutfit}"
2. Specify the SAME art style: "2D hand-drawn animated style, soft rounded shapes, watercolor backgrounds, thick gentle outlines"
3. Describe the specific setting, pose, expression, and background for THAT scene
4. Include at least one consistent visual anchor (e.g., a companion animal or object) that appears in every scene

EPISODE STRUCTURE — think of this as a TV show episode:
- Scene 1: Hook — ${name} discovers something intriguing about ${learningTopic}
- Scene 2: Exploration — ${name} dives deeper, learns the first key concept
- Scene 3: Challenge + Interactive Moment — a puzzle or question about ${learningTopic}
- Scene 4: Breakthrough — ${name} applies what they learned
- Scene 5: Celebration — ${name} reflects and feels proud

Requirements:
1. ${name} is the hero of every scene
2. Incorporate at least 3 of their personal interests naturally
3. Each scene teaches something about ${learningTopic}
4. Include Zones of Regulation emotional beats (green → yellow → green arc)
5. Warm, encouraging, sensory-friendly pacing
6. One interactive moment in scene 3

Respond ONLY with valid JSON in this exact format:
{
  "title": "Episode title",
  "learningObjective": "What the child will learn",
  "scenes": [
    {
      "index": 0,
      "title": "Scene title",
      "narration": "Warm narration text (2-3 sentences, spoken aloud by narrator)",
      "dialogue": [
        {
          "speaker": "${name}",
          "text": "What ${name} says",
          "emotion": "happy",
          "voiceDirection": "warmly, with excitement"
        }
      ],
      "emotionBeat": {
        "primaryEmotion": "curious",
        "zone": "green",
        "intensity": 5,
        "teachingMoment": "When we feel curious, our brain is ready to learn!"
      },
      "visualPrompt": "FULL visual description starting with character appearance, then setting, pose, expression, background, mood, lighting. Must be self-contained — do not reference other scenes.",
      "transitionType": "crossfade",
      "duration": 8,
      "interactiveMoment": null
    }
  ]
}

For scene 3, include an interactiveMoment:
{
  "type": "question",
  "prompt": "A question about ${learningTopic}",
  "options": ["Option A", "Option B", "Option C"],
  "correctAnswer": "Option A",
  "encouragement": "Great thinking, ${name}!",
  "pauseDuration": 10
}

Make the episode magical, personal, and educational. ${name} should feel like the star of their own show.`;
}

function parseEpisodeResponse(text: string, profile: ChildProfile): Episode {
  // Extract JSON from the response
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
