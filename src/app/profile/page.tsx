'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PROFILE_PRESETS, type ProfilePreset } from '@/lib/presets';

const CUSTOM_PRESETS_KEY = 'lorelearn_custom_presets';

function getCustomPresets(): Record<string, ProfilePreset> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CUSTOM_PRESETS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCustomPresets(presets: Record<string, ProfilePreset>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(presets));
}

function ArrayEditor({ label, values, onChange }: { label: string; values: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState('');

  return (
    <div>
      <label className="block text-xs text-white/40 uppercase tracking-wider mb-1">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {values.map((v, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-xs">
            {v}
            <button onClick={() => onChange(values.filter((_, j) => j !== i))} className="hover:text-red-400 transition-colors">&times;</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && input.trim()) { e.preventDefault(); onChange([...values, input.trim()]); setInput(''); }
          }}
          placeholder={`Add ${label.toLowerCase()}...`}
          className="flex-1 py-1.5 px-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-purple-400"
        />
        <button
          onClick={() => { if (input.trim()) { onChange([...values, input.trim()]); setInput(''); } }}
          className="px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-lg text-sm hover:bg-purple-500/30 transition-colors"
        >+</button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [selectedKey, setSelectedKey] = useState<string>('sania');
  const [profile, setProfile] = useState<ProfilePreset>(PROFILE_PRESETS.sania);
  const [customPresets, setCustomPresets] = useState<Record<string, ProfilePreset>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const customs = getCustomPresets();
    setCustomPresets(customs);
    // If a custom version of the selected preset exists, load it instead of the hardcoded one
    if (customs[selectedKey]) {
      setProfile(JSON.parse(JSON.stringify(customs[selectedKey])));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allPresets = { ...PROFILE_PRESETS, ...customPresets };

  const handleSelect = (key: string) => {
    setSelectedKey(key);
    // Custom presets override hardcoded ones — so user edits are preserved
    const merged = { ...PROFILE_PRESETS, ...customPresets };
    if (merged[key]) setProfile(JSON.parse(JSON.stringify(merged[key])));
    setSaved(false);
  };

  const updateAvatar = (field: string, value: string) => {
    setProfile((prev) => ({
      ...prev,
      profile: { ...prev.profile, avatar: { ...prev.profile.avatar, [field]: value } },
    }));
    setSaved(false);
  };

  const updateInterests = (field: string, value: string[]) => {
    setProfile((prev) => ({
      ...prev,
      profile: { ...prev.profile, interests: { ...prev.profile.interests, [field]: value } },
    }));
    setSaved(false);
  };

  const handleSave = () => {
    const key = selectedKey === 'custom' ? `custom_${Date.now()}` : selectedKey;
    const updated = { ...customPresets, [key]: profile };
    setCustomPresets(updated);
    saveCustomPresets(updated);
    setSelectedKey(key);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const p = profile.profile;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/create" className="text-sm text-white/40 hover:text-white/70 flex items-center gap-1 mb-2 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Back to Create
            </Link>
            <h1 className="text-3xl font-bold text-white">Profile Editor</h1>
            <p className="text-purple-300 text-sm mt-1">Edit how your learner looks and what they like</p>
          </div>
        </div>

        {/* Profile selector */}
        <div className="mb-6">
          <label className="block text-xs text-white/40 uppercase tracking-wider mb-1.5">Select Profile</label>
          <select
            value={selectedKey}
            onChange={(e) => handleSelect(e.target.value)}
            className="w-full py-2.5 px-4 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 appearance-none cursor-pointer"
          >
            {Object.entries(allPresets).map(([key, preset]) => (
              <option key={key} value={key} className="bg-gray-900">{preset.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-4">Basic Info</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-wider mb-1">Name</label>
                <input value={p.name} onChange={(e) => { setProfile((prev) => ({ ...prev, label: e.target.value, profile: { ...prev.profile, name: e.target.value } })); setSaved(false); }}
                  className="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-400" />
              </div>
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-wider mb-1">Age</label>
                <input type="number" value={p.age} onChange={(e) => { setProfile((prev) => ({ ...prev, profile: { ...prev.profile, age: Number(e.target.value) } })); setSaved(false); }}
                  className="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-400" />
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-4">Appearance</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'hairColor', label: 'Hair Color' },
                { key: 'hairStyle', label: 'Hair Style' },
                { key: 'skinTone', label: 'Skin Tone' },
                { key: 'eyeColor', label: 'Eye Color' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs text-white/40 uppercase tracking-wider mb-1">{label}</label>
                  <input
                    value={(p.avatar as unknown as Record<string, string>)[key] || ''}
                    onChange={(e) => updateAvatar(key, e.target.value)}
                    className="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-400"
                  />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-xs text-white/40 uppercase tracking-wider mb-1">Favorite Outfit</label>
                <input
                  value={p.avatar.favoriteOutfit}
                  onChange={(e) => updateAvatar('favoriteOutfit', e.target.value)}
                  className="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-400"
                />
              </div>
              <div className="col-span-2">
                <ArrayEditor label="Distinguishing Features" values={p.avatar.distinguishingFeatures} onChange={(v) => {
                  setProfile((prev) => ({
                    ...prev,
                    profile: { ...prev.profile, avatar: { ...prev.profile.avatar, distinguishingFeatures: v } },
                  }));
                  setSaved(false);
                }} />
              </div>
            </div>
          </div>

          {/* Interests */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-4">Interests</h2>
            <div className="space-y-4">
              {[
                { key: 'animals', label: 'Favorite Animals' },
                { key: 'foods', label: 'Favorite Foods' },
                { key: 'tvShows', label: 'TV Shows' },
                { key: 'games', label: 'Games & Activities' },
                { key: 'colors', label: 'Favorite Colors' },
                { key: 'places', label: 'Favorite Places' },
                { key: 'specialInterests', label: 'Special Interests' },
                { key: 'comfortObjects', label: 'Comfort Objects' },
              ].map(({ key, label }) => (
                <ArrayEditor
                  key={key}
                  label={label}
                  values={(p.interests as unknown as Record<string, string[]>)[key] || []}
                  onChange={(v) => updateInterests(key, v)}
                />
              ))}
            </div>
          </div>

          {/* Sensory Preferences */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-4">Sensory Preferences</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'preferredVoiceTone', label: 'Voice Tone', options: ['calm', 'warm', 'energetic'] },
                { key: 'preferredPace', label: 'Preferred Pace', options: ['slow', 'medium', 'fast'] },
                { key: 'visualSensitivity', label: 'Visual Sensitivity', options: ['low', 'medium', 'high'] },
                { key: 'audioSensitivity', label: 'Audio Sensitivity', options: ['low', 'medium', 'high'] },
              ].map(({ key, label, options }) => (
                <div key={key}>
                  <label className="block text-xs text-white/40 uppercase tracking-wider mb-1">{label}</label>
                  <select
                    value={(p.sensoryPreferences as unknown as Record<string, string>)[key] || options[1]}
                    onChange={(e) => {
                      setProfile((prev) => ({
                        ...prev,
                        profile: { ...prev.profile, sensoryPreferences: { ...prev.profile.sensoryPreferences, [key]: e.target.value } },
                      }));
                      setSaved(false);
                    }}
                    className="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-400 appearance-none cursor-pointer"
                  >
                    {options.map((o) => <option key={o} value={o} className="bg-gray-900">{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            className={`w-full py-3 font-semibold rounded-xl transition-all text-sm ${saved ? 'bg-green-500/20 text-green-300' : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'}`}
          >
            {saved ? 'Saved! This profile will be used for all new videos.' : 'Save Profile'}
          </button>

          {/* Profile summary */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-3">Profile Summary</h2>
            <p className="text-purple-300 text-sm leading-relaxed">
              <span className="text-white font-medium">{p.name}</span>, age <span className="text-white font-medium">{p.age}</span> — {p.avatar.hairColor} {p.avatar.hairStyle} hair, {p.avatar.skinTone} skin, {p.avatar.eyeColor} eyes. Wearing {p.avatar.favoriteOutfit}.
              {p.interests.animals.length > 0 && <> Loves {p.interests.animals.join(', ')}.</>}
              {p.interests.colors.length > 0 && <> Favorite colors: {p.interests.colors.join(', ')}.</>}
            </p>
            <p className="text-white/30 text-xs mt-2">This is exactly what the AI will use to generate your character.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
