import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.error(
    'Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não configuradas. Verifique o arquivo .env'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});

export const STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'alunos';

/**
 * Faz upload de uma foto para o bucket público "alunos" e retorna a URL pública.
 * @param {File} file
 * @param {string} pasta - subpasta lógica, ex: "alunos" ou "usuarios"
 */
export async function uploadFoto(file, pasta = 'alunos') {
  if (!file) return null;
  const extensao = file.name.split('.').pop();
  const nomeArquivo = `${pasta}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${extensao}`;

  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(nomeArquivo, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(nomeArquivo);
  return data.publicUrl;
}
