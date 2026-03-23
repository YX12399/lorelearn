// Client-side episode storage using localStorage
// Stores episode metadata + scene URLs for offline access

export interface SavedEpisode {
  id: string;
  title: string;
  topic: string;
  childName: string;
  provider: string;
  createdAt: string;
  scenes: SavedScene[];
  thumbnail?: string; // first scene image URL
}

export interface SavedScene {
  index: number;
  narration: string;
  videoUrl?: string;
  audioUrl?: string;
  imageUrl?: string;
}

const STORAGE_KEY = 'lorelearn_episodes';

export function getSavedEpisodes(): SavedEpisode[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveEpisodeToHistory(episode: SavedEpisode): void {
  if (typeof window === 'undefined') return;
  const existing = getSavedEpisodes();
  // Replace if same ID exists, otherwise prepend
  const filtered = existing.filter((e) => e.id !== episode.id);
  filtered.unshift(episode);
  // Keep max 50 episodes
  const trimmed = filtered.slice(0, 50);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function deleteEpisodeFromHistory(id: string): void {
  if (typeof window === 'undefined') return;
  const existing = getSavedEpisodes();
  const filtered = existing.filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function getEpisodeById(id: string): SavedEpisode | undefined {
  return getSavedEpisodes().find((e) => e.id === id);
}
