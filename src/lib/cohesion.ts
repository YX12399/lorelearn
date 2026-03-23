import { Scene, ContinuityBible, SceneTransition, ChildProfile } from '@/types';

/**
 * Derive a deterministic seed from episode + scene index.
 * Keeps generated images visually cohesive across the episode.
 */
export function deriveSceneSeed(episodeId: string, sceneIndex: number): number {
  let hash = 0;
  const str = `${episodeId}-scene-${sceneIndex}`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 1_000_000;
}

/**
 * Build the master style directive that every image & video prompt must include.
 * This is the single source-of-truth for visual consistency.
 */
export function buildStyleDirective(profile: ChildProfile): string {
  const palette = buildColorPalette(profile);
  const lighting = profile.sensoryPreferences.prefersDimColors
    ? 'soft diffused lighting, gentle shadows, low contrast, pastel tones'
    : 'warm natural lighting, gentle golden-hour highlights, soft ambient glow';

  return [
    'STYLE LOCK: 2D hand-drawn animated style inspired by Studio Ghibli and Pixar shorts.',
    'Soft rounded character shapes, thick gentle outlines, watercolor-textured backgrounds.',
    `Color palette limited to: ${palette.join(', ')}.`,
    `Lighting: ${lighting}.`,
    'NO photorealism. NO 3D render. NO harsh shadows or high contrast.',
    'Consistent flat shading across all scenes. Same line weight throughout.',
  ].join(' ');
}

export function buildContinuityBible(
  scenes: Scene[],
  profile: ChildProfile,
  characterReferenceImageUrl?: string,
  episodeId?: string
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
    artStyle: buildStyleDirective(profile),
    sceneTransitions,
    ffmpegCommands,
    episodeSeedBase: episodeId ? deriveSceneSeed(episodeId, 0) : undefined,
  };
}

export function buildCharacterDescription(profile: ChildProfile): string {
  const { avatar, name } = profile;
  return [
    `${name} is the main character.`,
    `Appearance: ${avatar.hairColor} ${avatar.hairStyle} hair, ${avatar.skinTone} skin, ${avatar.eyeColor} eyes.`,
    `Outfit: ${avatar.favoriteOutfit}.`,
    avatar.distinguishingFeatures.length > 0
      ? `Distinguishing features: ${avatar.distinguishingFeatures.join(', ')}.`
      : '',
    'Draw with soft rounded features, large expressive eyes, friendly warm expression.',
    'Character proportions: slightly chibi with a large head, small body — approachable and child-friendly.',
    'IMPORTANT: Character must look IDENTICAL in every scene — same outfit, same hair, same features.',
  ]
    .filter(Boolean)
    .join(' ');
}

function buildColorPalette(profile: ChildProfile): string[] {
  const baseColors = profile.sensoryPreferences.prefersDimColors
    ? ['#E8F4F8', '#D4E8D0', '#F0E8D8', '#E8D4E8', '#D8E0F0']
    : ['#FFE4B5', '#98FB98', '#87CEEB', '#DDA0DD', '#FFD1DC'];

  const favoriteColors = profile.interests.colors.slice(0, 2);
  return [...baseColors, ...favoriteColors];
}

/**
 * Build a fully cohesive image prompt for a single scene.
 * Embeds the style directive, character description, and continuity references.
 */
export function buildSceneImagePrompt(
  scene: Scene,
  profile: ChildProfile,
  sceneIndex: number,
  totalScenes: number,
  isFirstScene: boolean
): string {
  const characterDesc = buildCharacterDescription(profile);
  const styleDirective = buildStyleDirective(profile);
  const emotionDesc = `showing ${scene.emotionBeat.primaryEmotion} emotion (${scene.emotionBeat.zone} zone)`;

  const parts = [
    `[Scene ${sceneIndex + 1} of ${totalScenes}]`,
    styleDirective,
    `CHARACTER: ${characterDesc}`,
    `SCENE: "${scene.title}". ${scene.narration}`,
    `CHARACTER EMOTION: ${emotionDesc}.`,
    `VISUAL DESCRIPTION: ${scene.visualPrompt}`,
    'Camera: wide establishing shot with character centered. Smooth composition.',
    isFirstScene
      ? 'This is the FIRST scene — establish the character design clearly with a full-body view.'
      : 'CONTINUITY: Match character design EXACTLY from previous scenes. Same outfit, same proportions, same art style.',
    'Aspect ratio: 16:9 cinematic widescreen. No text overlays. No UI elements.',
  ];

  return parts.join(' ');
}

/**
 * Build a fully cohesive video prompt for animating a scene image.
 */
export function buildSceneVideoPrompt(
  scene: Scene,
  profile: ChildProfile,
  previousEndFrameUrl?: string,
  characterReferenceUrl?: string
): string {
  const characterDesc = buildCharacterDescription(profile);
  const emotionDesc = `${scene.emotionBeat.primaryEmotion} emotion, ${scene.emotionBeat.zone} zone`;

  const parts = [
    `Animated children's show scene. ${characterDesc}`,
    `Scene: ${scene.title}.`,
    `${scene.narration}`,
    `Character showing ${emotionDesc}.`,
    `Visual: ${scene.visualPrompt}`,
    'Animation: smooth, slow, gentle movements appropriate for children.',
    'Camera: slow pan or slight zoom, NO jerky movements, NO sudden cuts.',
    'Color palette: warm, soft, child-friendly. NO flashing lights.',
    'Character blinks gently and makes small natural movements.',
  ];

  if (previousEndFrameUrl) {
    parts.push(
      'CONTINUITY: Maintain exact visual style from previous scene. Same character, same colors, same art style.'
    );
  }

  if (characterReferenceUrl) {
    parts.push('Character reference image provided — match appearance exactly.');
  }

  return parts.join(' ');
}

/**
 * Generate SRT subtitle content from episode scenes.
 */
export function generateSRT(scenes: Scene[]): string {
  const lines: string[] = [];
  let cumulativeTime = 0;

  scenes.forEach((scene, i) => {
    const startTime = cumulativeTime;
    const endTime = cumulativeTime + scene.duration;

    lines.push(`${i + 1}`);
    lines.push(`${formatSRTTime(startTime)} --> ${formatSRTTime(endTime)}`);
    lines.push(scene.narration);
    lines.push('');

    cumulativeTime = endTime;
  });

  return lines.join('\n');
}

function formatSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

function buildFFmpegCommands(scenes: Scene[], transitions: SceneTransition[]): string[] {
  const commands: string[] = [];

  if (scenes.length === 0) return commands;

  // Simple concat for all scene videos
  const videoInputs = scenes.map((_, i) => `-i scene_${i}.mp4`).join(' ');

  if (scenes.length === 1) {
    commands.push(`ffmpeg -i scene_0.mp4 -c copy output_episode.mp4`);
  } else {
    const filterComplex = buildFilterComplex(scenes, transitions);
    commands.push(
      `ffmpeg ${videoInputs} -filter_complex "${filterComplex}" -map "[final]" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p output_episode.mp4`
    );
  }

  // Add subtitles
  commands.push(
    `ffmpeg -i output_episode.mp4 -vf "subtitles=episode.srt:force_style='FontSize=22,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2,MarginV=30'" -c:a copy output_episode_subtitled.mp4`
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
      const offset =
        scenes.slice(0, i + 1).reduce((sum, s) => sum + s.duration, 0) -
        transition.durationSeconds;
      parts.push(
        `${currentLabel}${nextInput}xfade=transition=fade:duration=${transition.durationSeconds}:offset=${offset}${nextLabel}`
      );
    } else {
      parts.push(`${currentLabel}${nextInput}concat=n=2:v=1:a=0${nextLabel}`);
    }

    currentLabel = nextLabel;
  }

  return parts.join(';');
}
