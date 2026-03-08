import { createClient } from '@supabase/supabase-js';

// Build-time env vars (set via Vite build args)
// Falls back to runtime config injected by FastAPI into index.html
const _runtimeConfig = (window as any).__JURILAB_CONFIG__ ?? {};
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || _runtimeConfig.supabaseUrl || '') as string;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || _runtimeConfig.supabaseAnonKey || '') as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
