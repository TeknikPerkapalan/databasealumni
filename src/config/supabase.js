// ============================================================================
// SUPABASE CLIENT CONFIGURATION
// ============================================================================
// Loaded as ES module. Reads runtime configuration from window.ENV
// (set in env.js — see env.example.js). Falls back to placeholder values so
// the UI still renders before credentials are wired up.
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL      = window.ENV?.SUPABASE_URL      ?? 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = window.ENV?.SUPABASE_ANON_KEY ?? 'YOUR_ANON_KEY';

if (SUPABASE_URL.includes('YOUR_PROJECT')) {
  console.warn(
    '[Supabase] Using placeholder credentials. Copy env.example.js to env.js and fill in your project values.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession:    true,
    autoRefreshToken:  true,
    detectSessionInUrl: true,
  },
});

// Convenience: storage public URL helper
export const storagePublicUrl = (bucket, path) =>
  supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
