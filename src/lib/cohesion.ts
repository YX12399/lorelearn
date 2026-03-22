import { Scene, ContinuityBible, SceneTransition, ChildProfile } from '@/types';

export function buildContinuityBible(
  scenes: Scene[],
  profile: ChildProfile,
  characterReferenceImageUrl?: string
): ContinuityBible {
  const settingPalette = buildColorPalette(profile);

  const sceneTransitions: SceneTransition[] = scenes.slice(0, -1).map((scene, index) => ({
    fromSceneIndex: index,
    toSceneIndex: index + 1,
    type: scene.transitionType,
    durationSeconds: scene.transitionType === 'cut' ? 0 : 0.5,
    endFrameUrl: scene.generatedImage?.url,
    startFrameUrl: scenes[index + 1]?.generatedImage?.url,
  }));

  const ffmpegCommands = buildFFmpegCommands(scenes, sceneTransitions);

  return {
    characterDescription: buildCharacterDescription(profile),
    characterReferenceImageUrl,
    settingPalette,
    lightingStyle: profile.sensoryPreferences.prefersDimColors
      ? 'soft diffused lighting, gentle shadows, low contrast'
      : 'warm natural lighting, gentle highlights',
    artStyle: '2D animated style, soft rounded shapes, child-friendly, Pixar-inspired warmth',
    sceneTransitions,
    ffmpegCommands,
  };
}

function buildCharacterDescription(profile: ChildProfile): string {
  const { avatar, name } = profile;
  return `${name} is the main character. They have ${avatar.hairColor} ${avatar.hairStyle} hair, ${avatar.skinTone} skin tone, and ${avatar.eyeColor} eyes. They are wearing ${avatar.favoriteOutfit}. ${avatar.distinguishingFeatures.length > 0 ? `Special features: ${avatar.distinguishingFeatures.join(', ')}.` : ''} The character is drawn in a warm, friendly 2D animated style with soft, rounded features appropriate for a children's animated show.`;
}

function buildColorPalette(profile: ChildProfile): string[] {
  const baseColors = profile.sensoryPreferences.prefersDimColors
    ? ['#E8F4F8', '#D4E8D0', '#F0E8D8', '#E8D4E8']
    : ['#FFE4B5', '#98FB98', '#87CEEB', '#DDA0DD'];

  const favoriteColors = profile.interests.colors.slice(0, 2);
  return [...baseColors, ...favoriteColors];
}

export function buildSceneVideoPrompt(
  scene: Scene,
  profile: ChildProfile,
  previousEndFrameUrl?: string,
  characterReferenceUrl?: string
): string {
  const characterDesc = buildCharacterDescription(profile);
  const emotionDesc = `${scene.emotionBeat.primaryEmotion} emotion, ${scene.emotionBeat.zone} zone feeling`;

  let prompt = `Animated children's show scene. ${characterDesc} `;
  prompt += `Scene: ${scene.title}. `;
  prompt += `${scene.narration} `;
  prompt += `Character showing ${emotionDesc}. `;
  prompt += `Visual style: ${scene.visualPrompt} `;
  prompt += `Camera: smooth, slow movements appropriate for children. `;
  prompt += `Color palette: warm, soft, child-friendly colors. `;
  prompt += `No flashing lights. Gentle transitions. `;

  if (previousEndFrameUrl) {
    prompt += `Maintain visual continuity from previous scene. Same character appearance, same art style. `;
  }

  // characterReferenceUrl is used for context but not directly in the prompt string
  if (characterReferenceUrl) {
    prompt += `Character reference provided for consistency. `;
  }

  return prompt;
}

function buildFFmpegCommands(scenes: Scene[], transitions: SceneTransition[]): string[] {
  const commands: string[] = [];

  // Individual scene concat
  const videoInputs = scenes.map((_, i) => `-i scene_${i}.mp4`).join(' ');
  const filterComplex = buildFilterComplex(scenes, transitions);

  commands.push(
    `ffmpeg ${videoInputs} -filter_complex "${filterComplex}" -map "[final]" -c:v libx264 -preset slow -crf 18 output_episode.mp4`
  );

  // Add subtitles command
  commands.push(
    `ffmpeg -i output_episode.mp4 -vf subtitles=episode.srt output_episode_subtitled.mp4`
  );

  return commands;
}

function buildFilterComplex(scenes: Scene[], transitions: SceneTransition[]): string {
  if (scenes.length === 0) return '';
  if (scenes.length === 1) return '[0:v]copy[final]';

  const parts: string[] = [];
  let currentLabel = '[0:v]';

  for (let i = 0; i < transitions.length; i++) {
    const transition = transitions[i];
    const nextLabel = i === transitions.length - 1 ? '[final]' : `[v${i}]`;
    const nextInput = `[${i + 1}:v]`;

    if (transition.type === 'crossfade') {
      const offset = scenes.slice(0, i + 1).reduce((sum, s) => sum + s.duration, 0) - transition.durationSeconds;
      parts.push(`${currentLabel}${nextInput}xfade=transition=fade:duration=${transition.durationSeconds}:offset=${offset}${nextLabel}`);
    } else {
      parts.push(`${currentLabel}${nextInput}concat=n=2:v=1:a=0${nextLabel}`);
    }

    currentLabel = nextLabel;
  }

  return parts.join(';');
}
