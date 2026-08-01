-- Convert the legacy bootstrap administrator without changing its password hash.
UPDATE "User"
SET email = 'presidencia@comunidadalbas.com.mx',
    "displayName" = 'Presidencia',
    active = true,
    "mustChangePassword" = true,
    "updatedAt" = now()
WHERE email = 'admin@comunidadalbas.com.mx';

-- Presidencia retains full administration and receives the content/director role.
INSERT INTO "RoleAssignment" (id, "userId", role)
SELECT gen_random_uuid(), id, 'director'
FROM "User"
WHERE email = 'presidencia@comunidadalbas.com.mx'
ON CONFLICT ("userId", role) DO NOTHING;

-- A unique email plus this allowlist makes the five-account maximum enforceable
-- even if the application API is bypassed.
ALTER TABLE "User"
ADD CONSTRAINT "User_institutional_email_check"
CHECK (email IN (
  'presidencia@comunidadalbas.com.mx',
  'secretaria@comunidadalbas.com.mx',
  'tesoreria@comunidadalbas.com.mx',
  'contacto@comunidadalbas.com.mx',
  'transparencia@comunidadalbas.com.mx'
));
