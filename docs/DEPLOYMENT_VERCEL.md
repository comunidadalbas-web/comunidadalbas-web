# Despliegue en Vercel

## Requisitos

- Cuenta Vercel asociada a `comunidadalbasmx@gmail.com`
- Repositorio GitHub importado: `comunidadalbas-web/comunidadalbas-web`
- Node.js 24 LTS configurado en Vercel

## Pasos

1. Ir a https://vercel.com/new
2. Importar el repositorio `comunidadalbas-web/comunidadalbas-web`
3. Configurar el proyecto:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `pnpm build`
   - **Output Directory**: `.next`

4. Configurar variables de entorno (ver `docs/ENVIRONMENT_VARIABLES.md`)

5. Desplegar

## Notas

- **No publicar a producción** hasta que el dominio esté verificado y DNS configurado.
- Usar preview deployments para verificar cada PR antes de mergear a main.
- La configuración de DNS en Hostinger debe mantenerse manual (ver `docs/DNS_HOSTINGER_ZOHO_VERCEL.md`).
