#!/usr/bin/env node
/**
 * E2E Database Setup — deterministic, idempotent.
 *
 * Creates the local E2E database, pushes the Prisma schema, and seeds
 * synthetic fixtures. Safe to run multiple times.
 *
 * Usage:  node scripts/e2e-setup.cjs [--reset]
 *   --reset  drop and recreate the database (full clean)
 */
const { execSync } = require('child_process');
const path = require('path');
const { Client } = require(path.join(__dirname, '..', 'packages', 'db', 'node_modules', 'pg'));

const E2E_DB = 'comunidadalbas_e2e';
const E2E_URL = `postgresql://albas:albas_dev@localhost:55432/${E2E_DB}`;
const BASE_URL = 'postgresql://albas:albas_dev@localhost:55432/comunidad_albas';
const RESET = process.argv.includes('--reset');
const DB_DIR = path.join(__dirname, '..', 'packages', 'db');

async function main() {
  const client = new Client({ connectionString: BASE_URL });
  await client.connect();

  try {
    if (RESET) {
      console.log(`[e2e-setup] Dropping and recreating ${E2E_DB}...`);
      await client.query(
        `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
        [E2E_DB]
      );
      await client.query(`DROP DATABASE IF EXISTS ${E2E_DB}`);
      await client.query(`CREATE DATABASE ${E2E_DB}`);
    } else {
      const exists = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [E2E_DB]);
      if (exists.rows.length === 0) {
        console.log(`[e2e-setup] Creating ${E2E_DB}...`);
        await client.query(`CREATE DATABASE ${E2E_DB}`);
      } else {
        console.log(`[e2e-setup] Database ${E2E_DB} exists.`);
      }
    }
  } finally {
    await client.end();
  }

  console.log('[e2e-setup] Pushing Prisma schema...');
  execSync('npx prisma db push --skip-generate', {
    cwd: DB_DIR,
    env: { ...process.env, DATABASE_URL: E2E_URL },
    stdio: 'inherit',
  });

  console.log('[e2e-setup] Seeding synthetic fixtures...');
  await seed(E2E_URL);

  console.log('[e2e-setup] Done.');
}

async function seed(url) {
  const c = new Client({ connectionString: url });
  await c.connect();
  try {
    await c.query('BEGIN');

    await c.query(`
      INSERT INTO "Property" (id, code, name, type, status, "createdAt", "updatedAt")
      VALUES ('e2e_prop_001', 'E2E-TEST', 'Propiedad de prueba E2E', 'Departamento', 'ACTIVE', NOW(), NOW())
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, "updatedAt" = NOW()
    `);

    await c.query(`
      INSERT INTO "Building" (id, code, name, status, "createdAt", "updatedAt")
      VALUES ('e2e_bld_001', 'E2E-BLD', 'Edificio E2E', 'ACTIVE', NOW(), NOW())
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, "updatedAt" = NOW()
    `);

    await c.query(`
      INSERT INTO "Unit" (id, code, "apartmentNumber", "buildingId", "propertyId", status, "createdAt", "updatedAt")
      VALUES ('e2e_unit_001', 'E2E-U1', '201', 'e2e_bld_001', 'e2e_prop_001', 'ACTIVE', NOW(), NOW())
      ON CONFLICT (code) DO UPDATE SET "updatedAt" = NOW()
    `);

    const userA = 'e2e_user_owner';
    const userB = 'e2e_user_gestor';
    await c.query(
      `INSERT INTO "User" (id, email, "displayName", "passwordHash", active, "mustChangePassword", "createdAt", "updatedAt")
       VALUES ($1, 'owner-e2e@test.invalid', 'Propietario E2E', 'x', true, false, NOW(), NOW()),
              ($2, 'gestor-e2e@test.invalid', 'Gestor E2E', 'x', true, false, NOW(), NOW())
       ON CONFLICT (email) DO UPDATE SET "displayName" = EXCLUDED."displayName", "updatedAt" = NOW()`,
      [userA, userB]
    );

    await c.query(
      `INSERT INTO "RoleAssignment" (id, "userId", role)
       VALUES ('e2e_ra_001', $1, 'owner'), ('e2e_ra_002', $2, 'gestor')
       ON CONFLICT ("userId", role) DO NOTHING`,
      [userA, userB]
    );

    await c.query(`
      INSERT INTO "FeeConcept" (id, name, amount, "authoritySource", status)
      VALUES ('e2e_fc_001', 'Cuota de mantenimiento', 1500.00, 'Asamblea', 'ACTIVE')
      ON CONFLICT (id) DO NOTHING
    `);

    await c.query('COMMIT');
    console.log('[e2e-setup] Seed complete.');
  } catch (err) {
    await c.query('ROLLBACK');
    throw err;
  } finally {
    await c.end();
  }
}

main().catch((err) => {
  console.error('[e2e-setup] FAILED:', err.message);
  process.exit(1);
});
