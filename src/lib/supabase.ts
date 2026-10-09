import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.trim() !== '' &&
  !supabaseUrl.includes('placeholder.supabase.co') &&
  supabaseAnonKey.trim() !== '' &&
  supabaseAnonKey !== 'placeholder-key'
);

if (!isSupabaseConfigured) {
  console.info(
    'ℹ️ Cortex CRM: Supabase não detectado nas variáveis de ambiente. Operando em modo de banco de dados local com sincronização em tempo real e persistência local (dados prontos para uso).'
  );
}

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-key'
);
