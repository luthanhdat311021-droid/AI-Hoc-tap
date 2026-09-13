import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { LearningSession } from '@/types/feynman';

export const SUPABASE_URL_KEY = 'supabase_url_v1';
export const SUPABASE_ANON_KEY = 'supabase_anon_key_v1';

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  if (typeof window === 'undefined') {
    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    };
  }

  const url = localStorage.getItem(SUPABASE_URL_KEY) || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = localStorage.getItem(SUPABASE_ANON_KEY) || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return { url, anonKey };
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseCredentials();
  if (!url || !anonKey || !url.startsWith('http')) return null;
  try {
    return createClient(url, anonKey);
  } catch (e) {
    console.error('Error initializing Supabase Client', e);
    return null;
  }
}

export const supabaseService = {
  async fetchSessions(): Promise<LearningSession[] | null> {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
      const { data, error } = await client
        .from('learning_sessions')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetch error:', error.message);
        return null;
      }

      if (!data) return [];

      return data.map((row: any) => ({
        id: row.id,
        title: row.title,
        createdAt: row.created_at,
        inputType: row.input_type,
        sourceName: row.source_name,
        structuredNote: row.structured_note,
        mindmap: row.mindmap,
        flashcards: row.flashcards,
        quiz: row.quiz
      }));
    } catch (err) {
      console.error('Supabase fetch exception:', err);
      return null;
    }
  },

  async saveSession(session: LearningSession): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;

    try {
      const payload = {
        id: session.id,
        title: session.title,
        created_at: session.createdAt,
        input_type: session.inputType,
        source_name: session.sourceName || '',
        structured_note: session.structuredNote,
        mindmap: session.mindmap,
        flashcards: session.flashcards,
        quiz: session.quiz,
        updated_at: new Date().toISOString()
      };

      const { error } = await client.from('learning_sessions').upsert(payload);
      if (error) {
        console.error('Supabase save error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Supabase save exception:', err);
      return false;
    }
  },

  async deleteSession(id: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;

    try {
      const { error } = await client.from('learning_sessions').delete().eq('id', id);
      if (error) {
        console.error('Supabase delete error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Supabase delete exception:', err);
      return false;
    }
  }
};
