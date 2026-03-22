'use client';

import React, { useState } from 'react';
import { ChildProfile, EmotionalGoal } from '@/types';

const DEFAULT_PROFILE: Omit<ChildProfile, 'id'> = {
  name: 'Alex',
  age: 7,
  avatar: {
    hairColor: 'brown',
    hairStyle: 'short curly',
    skinTone: 'medium',
    eyeColor: 'brown',
    favoriteOutfit: 'blue dinosaur t-shirt and comfy jeans',
    distinguishingFeatures: ['freckles on nose'],
  },
  interests: {
    animals: ['dogs', 'dinosaurs', 'butterflies'],
    foods: ['mac and cheese', 'apple slices', 'goldfish crackers'],
    tvShows: ['Bluey', 'Paw Patrol', 'Magic School Bus'],
    games: ['Minecraft', 'puzzle games', 'building blocks'],
    colors: ['blue', 'green'],
    places: ['park', 'library', 'backyard'],
    specialInterests: ['dinosaurs', 'space', 'trains'],
    comfortObjects: ['stuffed elephant named Ellie', 'blue blanket'],
    musicGenres: ['upbeat kids songs'],
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
  emotionalGoals: ['identifying_emotions', 'self_regulation', 'confidence_building'],
  learningTopic: 'the water cycle',
  learningLevel: 'beginner',
};

const EMOTIONAL_GOAL_LABELS: Record<EmotionalGoal, string> = {
  identifying_emotions: 'Identifying Emotions',
  self_regulation: 'Self-Regulation',
  social_connection: 'Social Connection',
  coping_strategies: 'Coping Strategies',
  confidence_building: 'Confidence Building',
  transition_management: 'Transition Management',
};

interface TagInputProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

function TagInput({ label, values, onChange, placeholder }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addTag = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
      setInputValue('');
    }
  };

  const removeTag = (tag: string) => {
    onChange(values.filter(v => v !== tag));
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {values.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 text-blue-600 hover:text-blue-900 text-lg leading-none"
              aria-label={`Remove ${tag}`}
            >
              &times;
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder={placeholder || 'Type and press Enter'}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="button"
          onClick={addTag}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}

interface ProfileFormProps {
  onSubmit: (profile: ChildProfile) => void;
  isLoading?: boolean;
}

export default function ProfileForm({ onSubmit, isLoading = false }: ProfileFormProps) {
  const [profile, setProfile] = useState<Omit<ChildProfile, 'id'>>(DEFAULT_PROFILE);

  const updateProfile = <K extends keyof Omit<ChildProfile, 'id'>>(
    key: K,
    value: Omit<ChildProfile, 'id'>[K]
  ) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  const updateAvatar = <K extends keyof ChildProfile['avatar']>(
    key: K,
    value: ChildProfile['avatar'][K]
  ) => {
    setProfile(prev => ({ ...prev, avatar: { ...prev.avatar, [key]: value } }));
  };

  const updateInterests = <K extends keyof ChildProfile['interests']>(
    key: K,
    value: ChildProfile['interests'][K]
  ) => {
    setProfile(prev => ({ ...prev, interests: { ...prev.interests, [key]: value } }));
  };

  const updateSensory = <K extends keyof ChildProfile['sensoryPreferences']>(
    key: K,
    value: ChildProfile['sensoryPreferences'][K]
  ) => {
    setProfile(prev => ({ ...prev, sensoryPreferences: { ...prev.sensoryPreferences, [key]: value } }));
  };

  const toggleEmotionalGoal = (goal: EmotionalGoal) => {
    const current = profile.emotionalGoals;
    if (current.includes(goal)) {
      updateProfile('emotionalGoals', current.filter(g => g !== goal));
    } else {
      updateProfile('emotionalGoals', [...current, goal]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullProfile: ChildProfile = {
      ...profile,
      id: `profile-${Date.now()}`,
    };
    onSubmit(fullProfile);
  };

  const sectionClass = "bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1";
  const inputClass = "w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50";
  const selectClass = "w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50";

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-blue-700 mb-2">LoreLearn</h1>
        <p className="text-gray-500 text-lg">Create a personalized learning adventure</p>
      </div>

      {/* Basic Info */}
      <div className={sectionClass}>
        <h2 className="text-xl font-bold text-gray-800 mb-4">About the Child</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Child&apos;s Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={e => updateProfile('name', e.target.value)}
              className={inputClass}
              required
              placeholder="e.g., Alex"
            />
          </div>
          <div>
            <label className={labelClass}>Age</label>
            <input
              type="number"
              value={profile.age}
              onChange={e => updateProfile('age', parseInt(e.target.value))}
              className={inputClass}
              min={3}
              max={18}
              required
            />
          </div>
        </div>
      </div>

      {/* Avatar */}
      <div className={sectionClass}>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Character Appearance</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Hair Color</label>
            <input
              type="text"
              value={profile.avatar.hairColor}
              onChange={e => updateAvatar('hairColor', e.target.value)}
              className={inputClass}
              placeholder="e.g., brown, blonde, black"
            />
          </div>
          <div>
            <label className={labelClass}>Hair Style</label>
            <input
              type="text"
              value={profile.avatar.hairStyle}
              onChange={e => updateAvatar('hairStyle', e.target.value)}
              className={inputClass}
              placeholder="e.g., short curly, long straight"
            />
          </div>
          <div>
            <label className={labelClass}>Skin Tone</label>
            <input
              type="text"
              value={profile.avatar.skinTone}
              onChange={e => updateAvatar('skinTone', e.target.value)}
              className={inputClass}
              placeholder="e.g., light, medium, dark"
            />
          </div>
          <div>
            <label className={labelClass}>Eye Color</label>
            <input
              type="text"
              value={profile.avatar.eyeColor}
              onChange={e => updateAvatar('eyeColor', e.target.value)}
              className={inputClass}
              placeholder="e.g., brown, blue, green"
            />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Favorite Outfit</label>
            <input
              type="text"
              value={profile.avatar.favoriteOutfit}
              onChange={e => updateAvatar('favoriteOutfit', e.target.value)}
              className={inputClass}
              placeholder="e.g., blue dinosaur t-shirt and comfy jeans"
            />
          </div>
        </div>
        <div className="mt-4">
          <TagInput
            label="Distinguishing Features"
            values={profile.avatar.distinguishingFeatures}
            onChange={v => updateAvatar('distinguishingFeatures', v)}
            placeholder="e.g., freckles, glasses, dimples"
          />
        </div>
      </div>

      {/* Interests */}
      <div className={sectionClass}>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Interests & Favorites</h2>
        <div className="space-y-2">
          <TagInput label="Favorite Animals" values={profile.interests.animals} onChange={v => updateInterests('animals', v)} placeholder="e.g., dogs, dinosaurs" />
          <TagInput label="Favorite Foods" values={profile.interests.foods} onChange={v => updateInterests('foods', v)} placeholder="e.g., mac and cheese, pizza" />
          <TagInput label="Favorite TV Shows" values={profile.interests.tvShows} onChange={v => updateInterests('tvShows', v)} placeholder="e.g., Bluey, Paw Patrol" />
          <TagInput label="Favorite Games" values={profile.interests.games} onChange={v => updateInterests('games', v)} placeholder="e.g., Minecraft, Lego" />
          <TagInput label="Favorite Colors" values={profile.interests.colors} onChange={v => updateInterests('colors', v)} placeholder="e.g., blue, green" />
          <TagInput label="Favorite Places" values={profile.interests.places} onChange={v => updateInterests('places', v)} placeholder="e.g., park, library" />
          <TagInput label="Special Interests" values={profile.interests.specialInterests} onChange={v => updateInterests('specialInterests', v)} placeholder="e.g., trains, space, dinosaurs" />
          <TagInput label="Comfort Objects" values={profile.interests.comfortObjects} onChange={v => updateInterests('comfortObjects', v)} placeholder="e.g., stuffed elephant, blue blanket" />
          <TagInput label="Music Genres" values={profile.interests.musicGenres} onChange={v => updateInterests('musicGenres', v)} placeholder="e.g., upbeat kids songs" />
        </div>
      </div>

      {/* Sensory Preferences */}
      <div className={sectionClass}>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Sensory Preferences</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelClass}>Visual Sensitivity</label>
            <select
              value={profile.sensoryPreferences.visualSensitivity}
              onChange={e => updateSensory('visualSensitivity', e.target.value as 'low' | 'medium' | 'high')}
              className={selectClass}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Audio Sensitivity</label>
            <select
              value={profile.sensoryPreferences.audioSensitivity}
              onChange={e => updateSensory('audioSensitivity', e.target.value as 'low' | 'medium' | 'high')}
              className={selectClass}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Preferred Pace</label>
            <select
              value={profile.sensoryPreferences.preferredPace}
              onChange={e => updateSensory('preferredPace', e.target.value as 'slow' | 'medium' | 'fast')}
              className={selectClass}
            >
              <option value="slow">Slow</option>
              <option value="medium">Medium</option>
              <option value="fast">Fast</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Preferred Voice Tone</label>
            <select
              value={profile.sensoryPreferences.preferredVoiceTone}
              onChange={e => updateSensory('preferredVoiceTone', e.target.value as 'calm' | 'warm' | 'energetic')}
              className={selectClass}
            >
              <option value="calm">Calm</option>
              <option value="warm">Warm</option>
              <option value="energetic">Energetic</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {([
            ['prefersDimColors', 'Prefers Dim Colors'],
            ['prefersSubtitles', 'Prefers Subtitles'],
            ['prefersNarration', 'Prefers Narration'],
            ['avoidFlashing', 'Avoid Flashing'],
          ] as [keyof ChildProfile['sensoryPreferences'], string][]).map(([key, label]) => (
            <label key={key} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50 cursor-pointer hover:bg-blue-50 transition-colors">
              <input
                type="checkbox"
                checked={profile.sensoryPreferences[key] as boolean}
                onChange={e => updateSensory(key, e.target.checked)}
                className="w-5 h-5 rounded accent-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Emotional Goals */}
      <div className={sectionClass}>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Emotional Learning Goals</h2>
        <div className="grid grid-cols-2 gap-3">
          {(Object.entries(EMOTIONAL_GOAL_LABELS) as [EmotionalGoal, string][]).map(([goal, label]) => (
            <label
              key={goal}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                profile.emotionalGoals.includes(goal)
                  ? 'border-green-400 bg-green-50 text-green-800'
                  : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-green-50'
              }`}
            >
              <input
                type="checkbox"
                checked={profile.emotionalGoals.includes(goal)}
                onChange={() => toggleEmotionalGoal(goal)}
                className="w-5 h-5 rounded accent-green-500"
              />
              <span className="text-sm font-medium">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Learning Topic */}
      <div className={sectionClass}>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Learning Topic</h2>
        <div className="mb-4">
          <label className={labelClass}>What should {profile.name || 'the child'} learn about?</label>
          <input
            type="text"
            value={profile.learningTopic}
            onChange={e => updateProfile('learningTopic', e.target.value)}
            className={inputClass}
            required
            placeholder="e.g., the water cycle, fractions, photosynthesis"
          />
        </div>
        <div>
          <label className={labelClass}>Learning Level</label>
          <select
            value={profile.learningLevel}
            onChange={e => updateProfile('learningLevel', e.target.value as 'beginner' | 'intermediate' | 'advanced')}
            className={selectClass}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-5 px-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xl font-bold rounded-2xl shadow-lg hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-3">
            <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Creating your adventure...
          </span>
        ) : (
          `Create ${profile.name || 'the'}'s Adventure!`
        )}
      </button>
    </form>
  );
}
