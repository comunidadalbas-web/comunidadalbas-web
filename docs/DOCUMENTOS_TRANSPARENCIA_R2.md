# Documentos y transparencia - preparación previa

Estado: preparado localmente. No desplegado y sin recursos externos creados.

## Decisión de almacenamiento

Se recomienda Cloudflare R2 Standard para los PDF públicos. La cuota gratuita vigente incluye
10 GB-mes de almacenamiento, 1 millón de operaciones de escritura, 10 millones de lecturas y
egreso directo sin costo. Para producción debe usarse un dominio personalizado; `r2.dev` se
reserva para desarrollo y puede aplicar límites variables.

Fuentes oficiales:

- https://developers.cloudflare.com/r2/pricing/
- https://developers.cloudflare.com/r2/buckets/public-buckets/
- https://developers.cloudflare.com/r2/platform/limits/

Vercel Blob se conserva para imágenes del CMS. Su integración actual funciona, pero el plan
Hobby incluye 1 GB de Blob y 10 GB de transferencia mensual, por lo que R2 ofrece más margen
para el histórico de actas escaneadas.

## Configuración pendiente en Cloudflare

1. Crear un bucket R2 Standard llamado `comunidadalbas-documentos`.
2. Conectar el dominio público `documentos.comunidadalbas.com.mx` al bucket.
3. Crear una credencial limitada exclusivamente a lectura y escritura de objetos de ese bucket.
4. Configurar CORS para aceptar cargas desde producción y desarrollo:

```json
[
  {
    "AllowedOrigins": [
      "https://comunidadalbas.com.mx",
      "https://www.comunidadalbas.com.mx",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

5. Registrar en Vercel, sólo después de aprobación, las variables `R2_ACCOUNT_ID`,
   `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` y `R2_PUBLIC_BASE_URL`.
6. No pegar credenciales en archivos del repositorio, capturas, chats ni documentación.

## Controles preparados

- Carga directa mediante URL firmada que vence en diez minutos.
- Confirmación firmada ligada al usuario administrativo, archivo, tamaño y vencimiento.
- Sólo PDF, máximo 20 MB; recomendación operativa de 10 MB.
- Comprobación del tipo, tamaño y encabezado `%PDF-` desde R2 antes de aceptar la carga.
- SHA-256 calculado en el navegador, verificado nuevamente desde R2 y conservado en el catálogo público.
- Publicación separada de la carga: requiere visibilidad pública y aprobación administrativa.
- Los registros permanentes no pueden eliminarse sin retirar antes esa protección.
- Las actas deben revisarse para ocultar firmas, domicilios, teléfonos, correos y otros datos no
  necesarios antes de publicarlas.

## Inventario aportado

| Documento                                       |           Tamaño | SHA-256                                                            | Tratamiento propuesto                                                                |
| ----------------------------------------------- | ---------------: | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Ley de Condominio del Estado de México aportada |     58,483 bytes | `26b10a0e5ee47555f568927adc712af40a2aade4f45af203ef42fe76682c71e3` | Permanente; rotular como copia aportada y enlazar también la fuente oficial vigente. |
| Reglamento Interno Granada                      |    331,587 bytes | `3a79993ddd8163ba372eef3b0c563df84dc4a41458dd1ec61240c98074e4d6da` | Permanente en Estatutos y reglamentos.                                               |
| Manual Digital Real Granada                     |  7,390,272 bytes | `903e8eef1b62b2c508f761922d7cfa3642281b57c04d142140e7a129d098c28c` | Permanente en Manuales y lineamientos; identificarlo como material aportado.         |
| Planos arquitectónicos aportados                | 15,832,895 bytes | `c4230edd2a73634a28f25edf9348a0f9c970ff3f6f888f6dae6986b060cca4db` | No publicar hasta revisar seguridad, datos técnicos y autorización de difusión.      |

La versión oficial en línea prevalece sobre la copia aportada de la ley, de acuerdo con
`06_FUENTES_NORMATIVAS/FUENTES_Y_VIGENCIA.md`.
