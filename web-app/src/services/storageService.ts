import { LearningSession } from '@/types/feynman';
import { supabaseService, SUPABASE_URL_KEY, SUPABASE_ANON_KEY } from './supabaseClient';

const STORAGE_KEY = 'feynman_learning_sessions_v1';
const API_KEY_STORAGE = 'gemini_api_key_v1';

export const storageService = {
  getSessions(): LearningSession[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading sessions from localStorage', e);
      return [];
    }
  },

  getSessionById(id: string): LearningSession | null {
    const sessions = this.getSessions();
    return sessions.find(s => s.id === id) || null;
  },

  saveSession(session: LearningSession): void {
    if (typeof window === 'undefined') return;
    try {
      const sessions = this.getSessions();
      const existingIndex = sessions.findIndex(s => s.id === session.id);
      if (existingIndex >= 0) {
        sessions[existingIndex] = session;
      } else {
        sessions.unshift(session);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));

      // Asynchronously save to Supabase PostgreSQL Database via API route
      fetch('/api/db/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session)
      }).catch(err => console.warn('Supabase DB async save error:', err));
    } catch (e) {
      console.error('Error saving session to localStorage', e);
    }
  },

  deleteSession(id: string): void {
    if (typeof window === 'undefined') return;
    try {
      const sessions = this.getSessions().filter(s => s.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));

      // Asynchronously delete from Supabase PostgreSQL Database
      fetch(`/api/db/sessions?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      }).catch(err => console.warn('Supabase DB async delete error:', err));
    } catch (e) {
      console.error('Error deleting session', e);
    }
  },

  async syncFromSupabase(): Promise<LearningSession[] | null> {
    try {
      const res = await fetch('/api/db/sessions');
      if (res.ok) {
        const data = await res.json();
        if (data.sessions && Array.isArray(data.sessions) && data.sessions.length > 0) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.sessions));
          return data.sessions;
        }
      }
    } catch (err) {
      console.warn('Sync from Supabase DB notice:', err);
    }
    return null;
  },

  getSupabaseConfig(): { url: string; anonKey: string } {
    if (typeof window === 'undefined') return { url: '', anonKey: '' };
    return {
      url: localStorage.getItem(SUPABASE_URL_KEY) || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      anonKey: localStorage.getItem(SUPABASE_ANON_KEY) || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    };
  },

  saveSupabaseConfig(url: string, anonKey: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SUPABASE_URL_KEY, url.trim());
    localStorage.setItem(SUPABASE_ANON_KEY, anonKey.trim());
  },

  getApiKey(): string {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(API_KEY_STORAGE) || localStorage.getItem('gemini_key') || localStorage.getItem('groq_key') || '';
  },

  saveApiKey(key: string): void {
    if (typeof window === 'undefined') return;
    const trimmed = key.trim();
    localStorage.setItem(API_KEY_STORAGE, trimmed);
    if (trimmed.startsWith('gsk_')) {
      localStorage.setItem('groq_key', trimmed);
    } else {
      localStorage.setItem('gemini_key', trimmed);
    }
  },

  getGeminiKey(): string {
    if (typeof window === 'undefined') return '';
    const main = localStorage.getItem(API_KEY_STORAGE) || '';
    if (main && !main.startsWith('gsk_')) return main;
    return localStorage.getItem('gemini_key') || '';
  },

  getGroqKey(): string {
    if (typeof window === 'undefined') return '';
    const main = localStorage.getItem(API_KEY_STORAGE) || '';
    if (main.startsWith('gsk_')) return main;
    return localStorage.getItem('groq_key') || '';
  },

  saveBothKeys(geminiKey: string, groqKey: string): void {
    if (typeof window === 'undefined') return;
    const gKey = geminiKey.trim();
    const qKey = groqKey.trim();
    localStorage.setItem('gemini_key', gKey);
    localStorage.setItem('groq_key', qKey);
    if (gKey) localStorage.setItem(API_KEY_STORAGE, gKey);
    else if (qKey) localStorage.setItem(API_KEY_STORAGE, qKey);
    else localStorage.removeItem(API_KEY_STORAGE);
  }
};

