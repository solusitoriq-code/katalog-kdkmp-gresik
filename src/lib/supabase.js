import { createClient } from '@supabase/supabase-js';

const envUrl = String(import.meta.env?.VITE_SUPABASE_URL ?? '').trim();
const envAnonKey = String(import.meta.env?.VITE_SUPABASE_ANON_KEY ?? '').trim();

export function isSupabaseConfigured(url = envUrl, anonKey = envAnonKey) {
  const u = String(url ?? '').trim();
  const k = String(anonKey ?? '').trim();
  if (!u || !k) return false;
  if (u.includes('xxxxxxxxxxxxxx') || u.includes('YOUR_')) return false;
  if (k.endsWith('...') || k.includes('YOUR_')) return false;
  return true;
}

export function isDemoMode(url = envUrl, anonKey = envAnonKey) {
  return !isSupabaseConfigured(url, anonKey);
}

export const supabase = isSupabaseConfigured()
  ? createClient(envUrl, envAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

