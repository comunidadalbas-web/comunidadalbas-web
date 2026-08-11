import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_DOCUMENTS_BUCKET ?? 'comunidadalbas-documentos';

if (!url || !serviceRoleKey) {
  throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.');
}

const sourceDirectory = path.resolve(
  process.cwd(),
  '../../Comunidad_Albas_Paquete_Unificado_v2.0/Comunidad_Albas_Paquete_Unificado_v2.0/06_FUENTES_NORMATIVAS',
);
const filenames = [
  'Ley_Condominio_Estado_Mexico_aportada.pdf',
  'Reglamento_Interno_Granada.pdf',
  'Manual_Digital_Real_Granada.pdf',
];

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

for (const filename of filenames) {
  const key = `public/documents/normativos/${filename}`;
  const bytes = await readFile(path.join(sourceDirectory, filename));
  const { error } = await supabase.storage.from(bucket).upload(key, bytes, {
    contentType: 'application/pdf',
    cacheControl: '3600',
    upsert: false,
  });
  if (error && !/already exists/i.test(error.message)) {
    throw new Error(`${filename}: ${error.message}`);
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(key);
  console.log(
    JSON.stringify({
      filename,
      status: error ? 'already_exists' : 'uploaded',
      publicUrl: data.publicUrl,
    }),
  );
}
