import { createClient } from '@/lib/supabase/server';
import type { Episode, EpisodeStatus } from '@/types';

interface EpisodeRow {
  id: string;
  child_profile_id: string;
  parent_id: string;
  title: string;
  learning_objective: string;
  status: EpisodeStatus;
  scenes: Episode['scenes'];
  continuity_bible: Episode['continuityBible'];
  child_profile: Episode['childProfile'];
  created_at: string;
  updated_at: string;
}

function rowToEpisode(row: EpisodeRow): Episode {
  return {
    id: row.id,
    childProfile: row.child_profile,
    title: row.title,
    learningObjective: row.learning_objective,
    scenes: row.scenes,
    status: row.status,
    continuityBible: row.continuity_bible,
    createdAt: row.created_at,
  };
}

export async function getEpisodes(childProfileId?: string): Promise<Episode[]> {
  const supabase = await createClient();
  let query = supabase
    .from('episodes')
    .select('*')
    .order('created_at', { ascending: false });

  if (childProfileId) {
    query = query.eq('child_profile_id', childProfileId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as EpisodeRow[]).map(rowToEpisode);
}

export async function getEpisodeById(id: string): Promise<Episode | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('episodes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return rowToEpisode(data as EpisodeRow);
}

export async function saveEpisode(
  episode: Episode,
  childProfileId: string,
  parentId: string
): Promise<Episode> {
  const supabase = await createClient();

  // Strip base64 audio from scenes before storing — audio goes to Storage separately
  const scenesForStorage = episode.scenes.map((scene) => ({
    ...scene,
    generatedAudio: scene.generatedAudio
      ? {
          ...scene.generatedAudio,
          // Replace data URIs with empty string; Storage URL will be set separately
          url: scene.generatedAudio.url.startsWith('data:')
            ? ''
            : scene.generatedAudio.url,
        }
      : undefined,
  }));

  const { data, error } = await supabase
    .from('episodes')
    .upsert({
      id: episode.id,
      child_profile_id: childProfileId,
      parent_id: parentId,
      title: episode.title,
      learning_objective: episode.learningObjective,
      status: episode.status,
      scenes: scenesForStorage,
      continuity_bible: episode.continuityBible,
      child_profile: episode.childProfile,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToEpisode(data as EpisodeRow);
}

export async function updateEpisodeStatus(
  id: string,
  status: EpisodeStatus
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('episodes')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function updateEpisodeScenes(
  id: string,
  scenes: Episode['scenes']
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('episodes')
    .update({ scenes, status: 'complete', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(error.message);
}
