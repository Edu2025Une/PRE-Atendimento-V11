import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.js';

const supabaseUrl = process.env.SUPABASE_DB_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl) {
  console.warn('⚠️  SUPABASE_DB_URL não configurada');
}
if (!supabaseServiceKey) {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY não configurada');
}
if (!supabaseAnonKey) {
  console.warn('⚠️  SUPABASE_ANON_KEY não configurada');
}

function createSafeClient(url: string, key: string): SupabaseClient<Database> {
  if (!url || !key) {
    return {
      from: () => ({
        select: () => Promise.resolve({ data: null, error: { message: 'Supabase não configurado.' } }),
        insert: () => Promise.resolve({ data: null, error: { message: 'Supabase não configurado.' } }),
        update: () => Promise.resolve({ data: null, error: { message: 'Supabase não configurado.' } }),
        delete: () => Promise.resolve({ data: null, error: { message: 'Supabase não configurado.' } }),
        upsert: () => Promise.resolve({ data: null, error: { message: 'Supabase não configurado.' } }),
      }),
      auth: {
        admin: {
          generateLink: () => Promise.resolve({ data: null, error: new Error('Supabase não configurado.') }),
          createUser: () => Promise.resolve({ data: null, error: new Error('Supabase não configurado.') }),
        },
        getUser: () => Promise.resolve({ data: { user: null }, error: new Error('Supabase não configurado.') }),
      },
    } as unknown as SupabaseClient<Database>;
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false },
  });
}

export const supabaseAdmin = createSafeClient(supabaseUrl, supabaseServiceKey);
export const supabaseClient = createSafeClient(supabaseUrl, supabaseAnonKey);

export { supabaseUrl };
