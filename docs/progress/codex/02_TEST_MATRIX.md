# Matriz de pruebas

| Área | Prueba | Resultado | Pendiente |
|---|---|---|---|
| Código | typecheck | APROBADA | — |
| Código | unitarias | APROBADA | 92/92 |
| Código | build optimizado | APROBADA | Next 16.2.11 |
| Datos | Prisma validate/generate/migrate | APROBADA | 4 migraciones al día |
| Datos | Neon lectura y política institucional | APROBADA | 1 admin, restricción de 5 correos |
| Pagos | UI producción | APROBADA | sin envío |
| Pagos | firma webhook | APROBADA | proveedor real |
| Pagos | conciliación a adeudo | APROBADA CON PRECONDICIÓN | sólo aplica a unidad/cargo inequívocos |
| Finanzas | cargos/pagos/egresos | APROBADA | mutaciones efímeras y fail-closed |
| Documentos | alta/publicación/SHA-256 | APROBADA | URL HTTPS institucional |
| SMTP | verify y envío técnico | APROBADA | sin exponer credencial |
| UI | E2E escritorio/móvil | APROBADA | 14 escenarios totales |
| Medios | carga real de imagen en producción | APROBADA | 2.5 MB, URL y vista previa; archivo de prueba eliminado |
| Seguridad | carga sin sesión | APROBADA | 401; tipo, tamaño, rol y CSRF limitados |
| Publicación | borradores y documentos no aprobados | APROBADA | no visibles en páginas públicas |
