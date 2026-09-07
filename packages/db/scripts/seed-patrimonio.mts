/**
 * Seed de datos de desarrollo para PATRIMONIO v0.1.
 *
 * Uso:
 *   node --experimental-strip-types scripts/seed-patrimonio.mts
 *
 * Crea la primera propiedad (P-001) con sus cuotas administrativas.
 */
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

console.log('Iniciando seed de patrimonio v0.1...');

// 1. Crear propiedad P-001
const propertyResult = await sql`
  INSERT INTO "Property" (id, code, name, type, state, municipality, development, "privateArea", "unitNumber", "areaM2", "parkingSpace", use, status, "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), 'P-001', 'Real Granada — Albas 203', 'Departamento', 'Estado de México', 'Tecámac', 'Real Granada Quinta Etapa', 'Albas', '203', 67.04, '203', 'Habitacional', 'ACTIVE', now(), now())
  ON CONFLICT (code) DO NOTHING
  RETURNING id, code;
`;

if (propertyResult.length === 0) {
  console.log('Propiedad P-001 ya existe, omitiendo creación.');
} else {
  const propertyId = propertyResult[0].id;
  console.log(`Propiedad P-001 creada: ${propertyId}`);

  // 2. Crear unidad 203
  await sql`
    INSERT INTO "Unit" (id, code, "apartmentNumber", "buildingId", "propertyId", status, "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), 'P-001-U203', '203', (SELECT id FROM "Building" WHERE code = 'P-001' LIMIT 1), ${propertyId}, 'ACTIVE', now(), now())
    ON CONFLICT (code) DO NOTHING;
  `;
  console.log('Unidad 203 creada.');

  // 3. Crear cuotas administrativas
  const fees = [
    { name: 'Administración general A', amount: 200, beneficiary: 'Administración general' },
    { name: 'Administración general B', amount: 150, beneficiary: 'Administración general' },
    { name: 'Privada Albas', amount: 100, beneficiary: 'Mantenimiento de áreas comunes' },
  ];

  for (const fee of fees) {
    await sql`
      INSERT INTO "AdministrationFee" (id, "propertyId", name, amount, periodicity, beneficiary, "startDate", status, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${propertyId}, ${fee.name}, ${fee.amount}, 'Mensual', ${fee.beneficiary}, now(), 'ACTIVE', now(), now());
    `;
    console.log(`Cuota creada: ${fee.name} = $${fee.amount}`);
  }

  console.log('Seed de patrimonio v0.1 completado.');
}

process.exit(0);
