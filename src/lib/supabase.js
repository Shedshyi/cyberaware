import { createClient } from "@supabase/supabase-js";

// Ключи берутся из .env.local (см. .env.example).
// Без ключей сайт работает как раньше: прогресс хранится только в браузере.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && anonKey
  ? createClient(url, anonKey, {
      auth: {
        // PKCE кладёт код в ?code=..., а не в #hash — не конфликтует с HashRouter
        flowType: "pkce",
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  : null;

export const backendEnabled = !!supabase;
