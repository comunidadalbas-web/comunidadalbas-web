import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

dotenv.config({ path: '../../.env.local', override: false });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL no configurada');
}

const sql = neon(process.env.DATABASE_URL);

const [users, admins, duplicates, migrations, tables] = await Promise.all([
  sql`SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE active)::int AS active,
        COUNT(*) FILTER (WHERE "mustChangePassword")::int AS must_change
      FROM "User"`,
  sql`SELECT COUNT(DISTINCT u.id)::int AS total
      FROM "User" u
      JOIN "RoleAssignment" r ON r."userId" = u.id
      WHERE u.active = true AND r.role = 'admin'`,
  sql`SELECT COUNT(*)::int AS total FROM (
        SELECT "xRequestId"
        FROM "MercadoPagoWebhookEvent"
        WHERE "xRequestId" IS NOT NULL
        GROUP BY "xRequestId"
        HAVING COUNT(*) > 1
      ) duplicates`,
  sql`SELECT COUNT(*)::int AS total FROM "_prisma_migrations" WHERE finished_at IS NOT NULL`,
  sql`SELECT COUNT(*)::int AS total
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`,
]);

console.log(JSON.stringify({
  users: users[0],
  activeAdmins: admins[0].total,
  duplicateWebhookRequestIds: duplicates[0].total,
  appliedMigrations: migrations[0].total,
  publicTables: tables[0].total,
}));
