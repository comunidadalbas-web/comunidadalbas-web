# Guía de DNS — Hostinger + Vercel + Zoho

## Estado actual

- **Registrador**: Hostinger
- **Nameservers**: `horizon.dns-parking.com`, `orbit.dns-parking.com`
- **Dominio**: `comunidadalbas.com.mx`
- **Correo**: Zoho Mail (5 cuentas activas)
- **Alojamiento web**: Vercel (pendiente de configurar)

## Reglas inmutables

1. **No cambiar los nameservers** a Vercel ni Cloudflare.
2. **No modificar registros MX, SPF, DKIM ni DMARC** de Zoho.
3. Toda la configuración DNS debe hacerse **manualmente** desde el panel de Hostinger.

## Procedimiento para conectar Vercel

### 1. Importar el proyecto en Vercel

- Desde https://vercel.com, importar `comunidadalbas-web/comunidadalbas-web`
- Configurar root directory como `apps/web`

### 2. Obtener registros DNS desde Vercel

Una vez importado, Vercel mostrará los registros DNS necesarios.
Ejecutar en terminal local (si Vercel CLI está autenticado):

```bash
vercel domains inspect comunidadalbas.com.mx
```

Los valores típicos para Vercel son:

| Tipo | Nombre | Valor |
|------|--------|-------|
| CNAME | www | `cname.vercel-dns.com` |
| A | @ | `76.76.21.21` |
| A | @ | `76.76.21.98` |

> **Importante**: Verificar los valores exactos desde el panel de Vercel o CLI para este proyecto concreto. No hardcodear IPs.

### 3. Agregar registros en Hostinger

En el panel de DNS de Hostinger:

- **A record** para `comunidadalbas.com.mx` → IPs de Vercel
- **CNAME** para `www` → `cname.vercel-dns.com` (o el valor exacto)
- **Redirección canónica**: www → dominio raíz (configurar en Vercel)

### 4. Preservar registros de Zoho

Los siguientes registros **no deben modificarse ni eliminarse**:

```
MX: mx.zoho.com (priority 10)
MX: mx2.zoho.com (priority 20)

TXT: v=spf1 include:zoho.com ~all (SPF)
TXT: zoho-verify=... (DKIM)
TXT: v=DMARC1; p=quarantine; ... (DMARC)
```

### 5. Verificar después de la propagación

- HTTPS funcionando con certificado de Vercel
- Redirección www → raíz
- Correo funcionando (MX intactos)
- health endpoint: `https://comunidadalbas.com.mx/health`
