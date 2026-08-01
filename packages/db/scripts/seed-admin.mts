/**
 * Seed del primer usuario administrador.
 *
 * Uso:
 *   ADMIN_INITIAL_EMAIL="admin@comunidadalbas.com.mx" \
 *   ADMIN_INITIAL_PASSWORD="cambia-esta-contrasena" \
 *   node --experimental-strip-types scripts/seed-admin.mts
 *
 * El script hace upsert por email: si el usuario existe, actualiza su hash;
 * si no, lo crea y le asigna el rol "admin".
 */
import { neon } from '@neondatabase/serverless';
import { randomBytes, scryptSync } from 'node:crypto';

const email = process.env.ADMIN_INITIAL_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_INITIAL_PASSWORD;
const displayName = process.env.ADMIN_INITIAL_NAME?.trim() || 'Administrador';

if (!email || !password) {
  console.error('Faltan ADMIN_INITIAL_EMAIL y/o ADMIN_INITIAL_PASSWORD');
  process.exit(1);
}
if (password.length < 12) {
  console.error('La contraseña debe tener al menos 12 caracteres');
  process.exit(1);
}

const KEY_LEN = 64;
const salt = randomBytes(16).toString('hex');
const hash = `scrypt$${salt}$${scryptSync(password, salt, KEY_LEN).toString('hex')}`;

const sql = neon(process.env.DATABASE_URL!);

const upsertUser = await sql`
  INSERT INTO "User" (id, email, "displayName", "passwordHash", active, "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), ${email}, ${displayName}, ${hash}, true, now(), now())
  ON CONFLICT ("email") DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash", "updatedAt" = now()
  RETURNING id, email;
`;

const userId = upsertUser[0].id;

await sql`
  INSERT INTO "RoleAssignment" (id, "userId", role)
  VALUES (gen_random_uuid(), ${userId}, 'admin')
  ON CONFLICT ("userId", role) DO NOTHING;
`;

console.log(`Usuario administrador listo: ${upsertUser[0].email}`);
console.log('Roles: admin');
process.exit(0);
