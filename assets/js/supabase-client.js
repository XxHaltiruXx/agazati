// ====================================
// MEGOSZTOTT SUPABASE KLIENS
// ====================================

/**
 * Egyetlen globális Supabase kliens példány az összes modul számára
 * Ez megakadályozza a "Multiple GoTrueClient instances" figyelmeztetést
 */

const SUPABASE_URL = "https://ccpuoqrbmldunshaxpes.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjcHVvcXJibWxkdW5zaGF4cGVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MTE2MDUsImV4cCI6MjA3ODA4NzYwNX0.QpVCmzF96Fp5hdgFyR0VkT9RV6qKiLkA8Yv_LArSk5I";
const SUPABASE_AUTH_STORAGE_KEY = 'agazati-supabase-auth';

let supabaseInstance = null;
let initPromise = null;

/**
 * Supabase kliens példány lekérése (singleton pattern)
 * @returns {Promise<SupabaseClient>}
 */
export async function getSupabaseClient() {
  // Ha már van példány, visszaadjuk
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Ha éppen inicializálódik, várunk rá
  if (initPromise) {
    return initPromise;
  }

  // Inicializálás
  initPromise = (async () => {
    const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.0/+esm");
    
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
        storageKey: SUPABASE_AUTH_STORAGE_KEY // Egyedi kulcs
      }
    });

    return supabaseInstance;
  })();

  return initPromise;
}

/**
 * Supabase URL exportálása
 */
export { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_AUTH_STORAGE_KEY };
