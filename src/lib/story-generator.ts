import Anthropic from '@anthropic-ai/sdk';
import { ChildProfile, Episode, Scene } from '@/types';
import { buildContinuityBible } from './cohesion';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateEpisode(profile: ChildProfile): Promise<Episode> {
  const prompt = buildStoryPrompt(profile);

  const message = await client.messages.create({
    model: 'claude-opus-4-5',
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
  const { name, age, interests, learningTopic, avatar, emotionalGoals, sensoryPreferences } = profile;

  return `You are creating a personalized educational animated episode for an autistic child named ${name}, age ${age}.

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

Create a 5-scene personalized animated episode where ${name} IS THE PROTAGONIST. The episode should teach about ${learningTopic} using ${name}'s personal interests as the context and setting.

Requirements:
1. ${name} is the hero/protagonist of every scene
2. Incorporate at least 3 of their personal interests naturally into the story
3. Each scene teaches something about ${learningTopic}
4. Include Zones of Regulation emotional beats
5. The story should be warm, encouraging, and autism-friendly
6. Include one interactive moment (question, choice, or breathing exercise)
7. Gentle sensory-safe pacing

Respond ONLY with valid JSON in this exact format:
{
  "title": "Episode title",
  "learningObjective": "What the child will learn",
  "scenes": [
    {
      "index": 0,
      "title": "Scene title",
      "narration": "The warm narration text (2-3 sentences, spoken aloud)",
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
      "visualPrompt": "Detailed visual description for image generation: setting, ${name}'s pose and expression, lighting, mood, background elements. Include ${name}'s specific appearance. 2D animated children's show style.",
      "transitionType": "crossfade",
      "duration": 8,
      "interactiveMoment": null
    }
  ]
}

For the 3rd scene, include an interactiveMoment like:
{
  "type": "question",
  "prompt": "A question to ask ${name}",
  "options": ["Option A", "Option B", "Option C"],
  "correctAnswer": "Option A",
  "encouragement": "Great thinking!",
  "pauseDuration": 10
}

Make the episode magical, personal, and educational. ${name} should feel seen and celebrated.`;
}

function parseEpisodeResponse(text: string, profile: ChildProfile): Episode {
  // Extract JSON from the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in Claude response');

  const data = JSON.parse(jsonMatch[0]);

  const scenes: Scene[] = data.scenes.map((s: Record<string, unknown>, index: number) => ({
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
  }));

  const episode: Episode = {
    id: `episode-${Date.now()}`,
    childProfile: profile,
    title: data.title,
    learningObjective: data.learningObjective,
    scenes,
    createdAt: new Date().toISOString(),
    status: 'planning',
    continuityBible: buildContinuityBible(scenes, profile),
  };

  return episode;
}
