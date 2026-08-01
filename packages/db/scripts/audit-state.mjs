import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

dotenv.config({ path: '../../.env.local', override: false });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL no configurada');
}

const sql = neon(process.env.DATABASE_URL);

const [users, accounts, admins, duplicates, migrations, tables, financeRows, policyConstraint] =
  await Promise.all([
    sql`SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE active)::int AS active,
        COUNT(*) FILTER (WHERE "mustChangePassword")::int AS must_change
      FROM "User"`,
    sql`SELECT email, active, "mustChangePassword" AS must_change
      FROM "User"
      ORDER BY "createdAt"`,
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
    sql`SELECT
        (SELECT COUNT(*)::int FROM "Charge") AS charges,
        (SELECT COUNT(*)::int FROM "Payment") AS payments,
        (SELECT COUNT(*)::int FROM "Expense") AS expenses,
        (SELECT COUNT(*)::int FROM "Document") AS documents`,
    sql`SELECT COUNT(*)::int AS total
      FROM pg_constraint
      WHERE conname = 'User_institutional_email_check' AND convalidated = true`,
  ]);

console.log(
  JSON.stringify({
    users: users[0],
    accounts,
    activeAdmins: admins[0].total,
    duplicateWebhookRequestIds: duplicates[0].total,
    appliedMigrations: migrations[0].total,
    publicTables: tables[0].total,
    financeRows: financeRows[0],
    institutionalEmailConstraint: policyConstraint[0].total === 1,
  }),
);
