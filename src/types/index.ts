// Child profile types
export interface ChildProfile {
  id: string;
  name: string;
  age: number;
  avatar: AvatarConfig;
  interests: Interests;
  sensoryPreferences: SensoryPreferences;
  emotionalGoals: EmotionalGoal[];
  learningTopic: string;
  learningLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface AvatarConfig {
  hairColor: string;
  hairStyle: string;
  skinTone: string;
  eyeColor: string;
  favoriteOutfit: string;
  distinguishingFeatures: string[];
}

export interface Interests {
  animals: string[];
  foods: string[];
  tvShows: string[];
  games: string[];
  colors: string[];
  places: string[];
  specialInterests: string[];
  comfortObjects: string[];
  musicGenres: string[];
}

export interface SensoryPreferences {
  visualSensitivity: 'low' | 'medium' | 'high';
  audioSensitivity: 'low' | 'medium' | 'high';
  preferredPace: 'slow' | 'medium' | 'fast';
  prefersDimColors: boolean;
  prefersSubtitles: boolean;
  prefersNarration: boolean;
  avoidFlashing: boolean;
  preferredVoiceTone: 'calm' | 'warm' | 'energetic';
}

export type EmotionalGoal =
  | 'identifying_emotions'
  | 'self_regulation'
  | 'social_connection'
  | 'coping_strategies'
  | 'confidence_building'
  | 'transition_management';

// Zone of Regulation
export type ZoneOfRegulation = 'blue' | 'green' | 'yellow' | 'red';

export interface EmotionEntry {
  name: string;
  zone: ZoneOfRegulation;
  bodySignals: string[];
  visualCues: string[];
  copingStrategies: string[];
  validationPhrases: string[];
  complexity: 'basic' | 'intermediate' | 'advanced';
  relatedEmotions: string[];
}

// Episode types
export interface Episode {
  id: string;
  childProfile: ChildProfile;
  title: string;
  learningObjective: string;
  scenes: Scene[];
  createdAt: string;
  status: EpisodeStatus;
  continuityBible: ContinuityBible;
}

export type EpisodeStatus =
  | 'planning'
  | 'generating_images'
  | 'generating_video'
  | 'generating_voice'
  | 'complete'
  | 'error';

export interface Scene {
  id: string;
  index: number;
  title: string;
  narration: string;
  dialogue: DialogueLine[];
  emotionBeat: EmotionBeat;
  visualPrompt: string;
  interactiveMoment?: InteractiveMoment;
  generatedImage?: GeneratedImage;
  generatedVideo?: GeneratedVideo;
  generatedAudio?: GeneratedAudio;
  duration: number; // seconds
  transitionType: 'cut' | 'crossfade' | 'wipe' | 'dissolve';
}

export interface DialogueLine {
  speaker: string;
  text: string;
  emotion: string;
  voiceDirection: string;
}

export interface EmotionBeat {
  primaryEmotion: string;
  zone: ZoneOfRegulation;
  intensity: number; // 1-10
  transitionFrom?: string;
  transitionTo?: string;
  teachingMoment?: string;
}

export interface InteractiveMoment {
  type:
    | 'question'
    | 'choice'
    | 'pause_and_breathe'
    | 'emotion_check'
    | 'celebration';
  prompt: string;
  options?: string[];
  correctAnswer?: string;
  encouragement: string;
  pauseDuration: number; // seconds
}

export interface GeneratedImage {
  url: string;
  prompt: string;
  seed?: number;
  isCharacterReference: boolean;
  frameIndex: number;
}

export interface GeneratedVideo {
  url: string;
  duration: number;
  startFrameUrl?: string;
  endFrameUrl?: string;
  prompt: string;
}

export interface GeneratedAudio {
  url: string;
  text: string;
  voiceId: string;
  duration: number;
}

// Continuity bible for visual cohesion
export interface ContinuityBible {
  characterDescription: string;
  characterReferenceImageUrl?: string;
  settingPalette: string[];
  lightingStyle: string;
  artStyle: string;
  sceneTransitions: SceneTransition[];
  ffmpegCommands: string[];
  episodeSeedBase?: number;
}

export interface SceneTransition {
  fromSceneIndex: number;
  toSceneIndex: number;
  type: 'cut' | 'crossfade' | 'wipe' | 'dissolve';
  durationSeconds: number;
  endFrameUrl?: string;
  startFrameUrl?: string;
}

// API request/response types
export interface StoryGenerationRequest {
  profile: ChildProfile;
}

export interface StoryGenerationResponse {
  episode: Episode;
}

export interface ImageGenerationRequest {
  sceneId: string;
  prompt: string;
  characterReferenceUrl?: string;
  seed?: number;
  isFirstScene?: boolean;
}

export interface ImageGenerationResponse {
  imageUrl: string;
  seed: number;
}

export interface VideoGenerationRequest {
  sceneId: string;
  imageUrl: string;
  prompt: string;
  startFrameUrl?: string;
  endFrameUrl?: string;
  characterReferenceUrls?: string[];
  duration?: number;
}

export interface VideoGenerationResponse {
  videoUrl: string;
  endFrameUrl?: string;
}

export interface MultiShotVideoRequest {
  shots: VideoShot[];
  characterReferenceUrls?: string[];
}

export interface VideoShot {
  imageUrl: string;
  prompt: string;
  duration: number;
}

export interface VoiceGenerationRequest {
  sceneId: string;
  text: string;
  voiceTone: 'calm' | 'warm' | 'energetic';
}

export interface VoiceGenerationResponse {
  audioUrl: string;
  duration: number;
}

// Pipeline state
export interface PipelineState {
  episodeId: string;
  currentStage: 'story' | 'images' | 'video' | 'voice' | 'complete';
  progress: number; // 0-100
  sceneProgress: SceneProgress[];
  error?: string;
}

export interface SceneProgress {
  sceneId: string;
  imageStatus: 'pending' | 'generating' | 'complete' | 'error';
  videoStatus: 'pending' | 'generating' | 'complete' | 'error';
  voiceStatus: 'pending' | 'generating' | 'complete' | 'error';
}
