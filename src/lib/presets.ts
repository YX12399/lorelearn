import { ChildProfile } from '@/types';

export interface ProfilePreset {
  label: string;
  profile: Omit<ChildProfile, 'id' | 'learningTopic'>;
}

export const PROFILE_PRESETS: Record<string, ProfilePreset> = {
  sania: {
    label: 'Sania',
    profile: {
      name: 'Sania',
      age: 6,
      avatar: {
        hairColor: 'dark brown',
        hairStyle: 'long wavy with a small braid',
        skinTone: 'warm olive',
        eyeColor: 'dark brown',
        favoriteOutfit: 'lavender dress with white sneakers and a butterfly hair clip',
        distinguishingFeatures: ['dimples when she smiles', 'butterfly hair clip'],
      },
      interests: {
        animals: ['butterflies', 'rabbits', 'dolphins', 'kittens'],
        foods: ['mangoes', 'pasta', 'chocolate chip cookies', 'strawberry smoothies'],
        tvShows: ['Bluey', 'Gabby\'s Dollhouse', 'StoryBots'],
        games: ['drawing', 'pretend cooking', 'hide and seek', 'puzzles'],
        colors: ['lavender', 'pink', 'sky blue', 'gold'],
        places: ['garden', 'beach', 'art room', 'library'],
        specialInterests: ['butterflies', 'flowers', 'painting', 'stars and constellations'],
        comfortObjects: ['stuffed bunny named Coco', 'sparkly purple blanket'],
        musicGenres: ['gentle lullabies', 'upbeat kids pop'],
      },
      sensoryPreferences: {
        visualSensitivity: 'medium',
        audioSensitivity: 'medium',
        preferredPace: 'medium',
        prefersDimColors: false,
        prefersSubtitles: true,
        prefersNarration: true,
        avoidFlashing: true,
        preferredVoiceTone: 'warm',
      },
      emotionalGoals: ['identifying_emotions', 'confidence_building', 'social_connection'],
      learningLevel: 'beginner',
    },
  },
  custom: {
    label: 'New Profile',
    profile: {
      name: '',
      age: 7,
      avatar: {
        hairColor: 'brown',
        hairStyle: 'short',
        skinTone: 'medium',
        eyeColor: 'brown',
        favoriteOutfit: 'casual t-shirt and jeans',
        distinguishingFeatures: [],
      },
      interests: {
        animals: [],
        foods: [],
        tvShows: [],
        games: [],
        colors: [],
        places: [],
        specialInterests: [],
        comfortObjects: [],
        musicGenres: [],
      },
      sensoryPreferences: {
        visualSensitivity: 'medium',
        audioSensitivity: 'medium',
        preferredPace: 'medium',
        prefersDimColors: false,
        prefersSubtitles: true,
        prefersNarration: true,
        avoidFlashing: true,
        preferredVoiceTone: 'warm',
      },
      emotionalGoals: ['identifying_emotions', 'confidence_building'],
      learningLevel: 'beginner',
    },
  },
};
