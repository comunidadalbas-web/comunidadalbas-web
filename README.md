# Comunidad Albas

Portal institucional de Privada Albas.

**Dominio:** [comunidadalbas.com.mx](https://comunidadalbas.com.mx)

---

## Stack

| Componente | Tecnología |
|---|---|
| Monorepo | pnpm workspaces |
| Frontend | Next.js 16 (App Router, TypeScript) |
| Base de datos | PostgreSQL + Prisma 7 |
| Validación | Zod |
| Pruebas | Vitest + Playwright |
| CI | GitHub Actions |
| Alojamiento | Vercel |
| Correo | Zoho Mail |

## Requisitos

- Node.js >= 24
- pnpm >= 10
- Docker (para PostgreSQL local)

## Inicio rápido

```bash
cp .env.example .env
docker compose up -d
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm dev
```

## Rutas públicas

| Ruta | Descripción |
|---|---|
| `/` | Portada institucional |
| `/nosotros` | Identidad y propósito |
| `/documentos` | Catálogo de documentos |
| `/contacto` | Formulario de contacto |
| `/privacidad` | Aviso de privacidad |
| `/health` | Health check técnico |

## Licencia

Privado — Todos los derechos reservados.
