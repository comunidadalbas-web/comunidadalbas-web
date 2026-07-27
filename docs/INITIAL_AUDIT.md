# Auditoría inicial del repositorio

## Estado encontrado

- El directorio de trabajo contenía documentación del proyecto (Paquete Unificado v2.0, identidad institucional, documentos legales) pero **no era un repositorio Git**.
- No existía clon del repositorio remoto `https://github.com/comunidadalbas-web/comunidadalbas-web.git`.
- El remoto no es accesible (no existe o no tiene permisos de lectura).
- El repo-starter (`04_PORTAL_Y_REPO/repo-starter/`) proporciona la base del monorepo.

## Decisiones conservadas

1. **Estructura monorepo** con pnpm workspaces, apps/web y packages/db + packages/core.
2. **Esquema Prisma** completo con Building, Unit, FeeConcept, Charge, Payment, PaymentApplication, Expense, Document, User, RoleAssignment, AuditLog.
3. **120 unidades en CSV de demostración** (temporal, marcadas como PROVISIONAL).
4. **Colores institucionales** (#17365d → refinado a #0a2a4a, #2e75b6).
5. **Mensaje de portal en construcción** conservado y expandido.

## Problemas corregidos

| Problema | Corrección |
|---|---|
| No había repositorio Git | `git init` + rama `bootstrap/opencode-phase-0` |
| `hostinger-recovery-codes.txt` en el directorio | Movido a `C:\Users\rbori\AppData\Local\Temp\opencode\` |
| `.gitignore` insuficiente | Expandido con recovery codes, credenciales, docs privados |
| Sin .nvmrc / .editorconfig | Creados |
| Sin ESLint / Prettier config | Agregados |
| Sin pruebas | Vitest + Playwright configurados |
| Sin CI | GitHub Actions creado |
| Schema Prisma sin `ContactRequest` | Modelo agregado con estados NEW, IN_REVIEW, RESOLVED, ARCHIVED |
| Sin middleware de seguridad | middleware.ts con headers y CSP |
| Sin validación server-side | Zod en API route de contacto |

## Riesgos

- **Repositorio remoto no accesible**: No se puede hacer push. Se requiere crear el repo en GitHub e importar.
- **Docker no disponible localmente**: PostgreSQL no puede iniciarse en esta máquina.
- **Prisma 7 y Next.js 16**: Versiones candidate/starter; verificar compatibilidad en el ecosistema real.
- **hostinger-recovery-codes.txt expuesto en el paquete compartido**: Se documenta riesgo; el propietario debe regenerar los códigos.

## Dependencias pendientes

- Docker Desktop (para PostgreSQL local)
- Cuenta Vercel conectada a GitHub
- Cuenta Zoho Mail configurada con SMTP
- Node.js 24 LTS y pnpm 10 (instalados)

## Plan ejecutado

1. Auditoría del directorio y documentación del proyecto
2. Inicialización del repositorio Git local
3. Segregación de archivos sensibles
4. Copia del repo-starter como base
5. Ampliación del esquema de base de datos
6. Construcción del sitio institucional (7 rutas)
7. Implementación del formulario de contacto con validación
8. Configuración de seguridad (headers, CSP, middleware)
9. Configuración de pruebas y CI
10. Documentación de despliegue y entrega a Codex
