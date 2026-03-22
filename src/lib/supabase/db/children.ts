import { createClient } from '@/lib/supabase/server';
import type { ChildProfile } from '@/types';

// Row shape from Postgres (snake_case)
interface ChildRow {
  id: string;
  parent_id: string;
  name: string;
  age: number;
  avatar: ChildProfile['avatar'];
  interests: ChildProfile['interests'];
  sensory_preferences: ChildProfile['sensoryPreferences'];
  emotional_goals: ChildProfile['emotionalGoals'];
  learning_topic: string;
  learning_level: ChildProfile['learningLevel'];
  created_at: string;
  updated_at: string;
}

function rowToProfile(row: ChildRow): ChildProfile {
  return {
    id: row.id,
    name: row.name,
    age: row.age,
    avatar: row.avatar,
    interests: row.interests,
    sensoryPreferences: row.sensory_preferences,
    emotionalGoals: row.emotional_goals,
    learningTopic: row.learning_topic,
    learningLevel: row.learning_level,
  };
}

export async function getChildren(): Promise<ChildProfile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('child_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as ChildRow[]).map(rowToProfile);
}

export async function getChildById(id: string): Promise<ChildProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('child_profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return rowToProfile(data as ChildRow);
}

export async function createChild(
  profile: Omit<ChildProfile, 'id'>,
  parentId: string
): Promise<ChildProfile> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('child_profiles')
    .insert({
      parent_id: parentId,
      name: profile.name,
      age: profile.age,
      avatar: profile.avatar,
      interests: profile.interests,
      sensory_preferences: profile.sensoryPreferences,
      emotional_goals: profile.emotionalGoals,
      learning_topic: profile.learningTopic,
      learning_level: profile.learningLevel,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToProfile(data as ChildRow);
}

export async function updateChild(
  id: string,
  updates: Partial<ChildProfile>
): Promise<ChildProfile> {
  const supabase = await createClient();
  const patch: Partial<Record<string, unknown>> = {};
  if (updates.name !== undefined) patch.name = updates.name;
  if (updates.age !== undefined) patch.age = updates.age;
  if (updates.avatar !== undefined) patch.avatar = updates.avatar;
  if (updates.interests !== undefined) patch.interests = updates.interests;
  if (updates.sensoryPreferences !== undefined) patch.sensory_preferences = updates.sensoryPreferences;
  if (updates.emotionalGoals !== undefined) patch.emotional_goals = updates.emotionalGoals;
  if (updates.learningTopic !== undefined) patch.learning_topic = updates.learningTopic;
  if (updates.learningLevel !== undefined) patch.learning_level = updates.learningLevel;
  patch.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('child_profiles')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToProfile(data as ChildRow);
}

export async function deleteChild(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('child_profiles')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}
