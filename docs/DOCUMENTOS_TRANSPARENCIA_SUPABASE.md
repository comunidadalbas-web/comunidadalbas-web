# Documentos y transparencia - Supabase Storage

Estado: bucket de producción creado; integración de aplicación preparada.

## Decisión de almacenamiento

Los PDF públicos se alojan en Supabase Storage y los metadatos continúan en Neon. El bucket
`comunidadalbas-documentos` es público sólo para lectura, restringe archivos a `application/pdf`
y aplica un máximo de 20 MB. Las imágenes del CMS permanecen en Vercel Blob.

El plan Free de Supabase incluye actualmente 1 GB de almacenamiento y 5 GB de transferencia. No
requiere habilitar facturación, pero los proyectos Free con poca actividad pueden pausarse. Por eso
esta opción es adecuada para iniciar el histórico sin cobros, no una garantía contractual de
disponibilidad permanente. Deben vigilarse uso, pausas y descargas; si el archivo crece, se evaluará
migrar a un servicio con continuidad garantizada.

Fuentes oficiales:

- https://supabase.com/docs/guides/platform/billing-on-supabase
- https://supabase.com/docs/guides/platform/free-project-pausing
- https://supabase.com/docs/guides/storage/buckets/fundamentals
- https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl

Firebase Storage no se eligió porque desde febrero de 2026 exige el plan Blaze para conservar el
acceso al bucket, aunque mantenga cuotas sin costo.

## Variables de producción

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY` (identificador público de cliente)
- `SUPABASE_SERVICE_ROLE_KEY` (secreto exclusivo del servidor)
- `SUPABASE_DOCUMENTS_BUCKET=comunidadalbas-documentos`

La clave administrativa nunca debe quedar en Git, capturas, chats, variables `NEXT_PUBLIC_*` ni
respuestas del API. El sistema entrega al navegador únicamente una autorización de carga temporal.

## Controles implementados

- Autorización de carga ligada al usuario administrativo, ruta, tamaño y vencimiento.
- Sólo PDF, máximo 20 MB; recomendación operativa de 10 MB.
- Bucket con límite de tamaño y MIME aplicado también del lado de Supabase.
- Comprobación del tamaño y encabezado `%PDF-` desde Storage antes de aceptar la carga.
- SHA-256 calculado en el navegador, verificado nuevamente en el servidor y conservado en el catálogo.
- Eliminación automática del objeto si falla la verificación.
- Publicación separada de la carga: requiere visibilidad pública y aprobación administrativa.
- Los registros permanentes no pueden eliminarse sin retirar antes esa protección.
- Las actas deben revisarse para ocultar firmas, domicilios, teléfonos, correos y otros datos no
  necesarios antes de publicarlas.

Supabase recomienda cargas reanudables TUS para archivos mayores de 6 MB. La carga firmada estándar
permite el límite configurado, pero si la conexión es inestable se debe optimizar el PDF o cargarlo
desde el panel de Storage y registrar su URL externa en el panel administrativo.

## Inventario aportado

| Documento                                       |           Tamaño | SHA-256                                                            | Tratamiento propuesto                                                                |
| ----------------------------------------------- | ---------------: | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Ley de Condominio del Estado de México aportada |     58,483 bytes | `26b10a0e5ee47555f568927adc712af40a2aade4f45af203ef42fe76682c71e3` | Permanente; rotular como copia aportada y enlazar también la fuente oficial vigente. |
| Reglamento Interno Granada                      |    331,587 bytes | `3a79993ddd8163ba372eef3b0c563df84dc4a41458dd1ec61240c98074e4d6da` | Permanente en Estatutos y reglamentos.                                               |
| Manual Digital Real Granada                     |  7,390,272 bytes | `903e8eef1b62b2c508f761922d7cfa3642281b57c04d142140e7a129d098c28c` | Permanente en Manuales y lineamientos; identificarlo como material aportado.         |
| Planos arquitectónicos aportados                | 15,832,895 bytes | `c4230edd2a73634a28f25edf9348a0f9c970ff3f6f888f6dae6986b060cca4db` | No publicar hasta revisar seguridad, datos técnicos y autorización de difusión.      |

La versión oficial en línea prevalece sobre la copia aportada de la ley, de acuerdo con
`06_FUENTES_NORMATIVAS/FUENTES_Y_VIGENCIA.md`.
