import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Sin las variables, la app funciona solo en local (IndexedDB), como antes.
export const supabase = url && key ? createClient(url, key) : null;
