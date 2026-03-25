// ── LoreLearn Types ──────────────────────────────────────────────

export interface Scene {
  title: string;
  narration: string;
  visualPrompt: string;
  duration: number; // seconds
  imageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
}

export interface Episode {
  id: string;
  topic: string;
  age: number;
  title: string;
  scenes: Scene[];
  createdAt: string;
  thumbnailUrl?: string;
}

export interface EpisodeHistoryItem {
  id: string;
  title: string;
  topic: string;
  thumbnailUrl?: string;
  createdAt: string;
}
