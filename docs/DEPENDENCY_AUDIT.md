# Auditoría de dependencias

## Versiones del starter vs. estables actuales

Revisión realizada el 26 de julio de 2026.

| Paquete | Versión en starter | Estado | Decisión |
|---|---|---|---|
| Node.js | >=24 | Correcta | Mantener |
| pnpm | 10.15.0 → 10.17.0 | Actualizada a 10.17.0 |
| Next.js | 16.2.11 | Candidate/stable | Mantener |
| React | ^19.2.0 | Stable | Mantener |
| React DOM | ^19.2.0 | Stable | Mantener |
| Zod | ^4.0.0 | Candidate | Mantener (API estable) |
| Prisma | ^7.0.0 | Candidate | Mantener (suficiente para MVP) |
| TypeScript | ^5.9.0 | Stable | Mantener |
| ESLint | ^9.25.0 | Stable | Mantener |
| Prettier | ^3.5.0 | Stable | Mantener |
| Vitest | ^3.1.0 | Stable | Mantener |
| Playwright | ^1.52.0 | Stable | Mantener |
| PG | ^8.13.0 | Stable | Mantener |

## Riesgos identificados

1. **Prisma 7** puede tener breaking changes frente a v6. Si surgen problemas de compatibilidad, considerar `prisma@^6.5.0`.
2. **Next.js 16** es una versión candidate. Si hay inestabilidad, migrar a Next.js 15 LTS.
3. **Zod 4** cambió la API respecto a v3. El código actual usa `z.object()` que es compatible.

## Conclusión

Se mantienen las versiones del starter por ser funcionales para el MVP. Si surgen problemas de compilación, la primera acción será revisar la documentación de Prisma 7 y Next.js 16.
