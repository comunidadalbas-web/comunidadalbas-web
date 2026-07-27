# Guía de DNS — Hostinger + Vercel + Zoho

## Estado actual

- **Registrador**: Hostinger
- **Nameservers**: `horizon.dns-parking.com`, `orbit.dns-parking.com`
- **Dominio**: `comunidadalbas.com.mx`
- **Correo**: Zoho Mail (5 cuentas activas)
- **Alojamiento web**: Vercel (configurado)

### Registros DNS configurados en Hostinger

| Tipo | Nombre | Valor | TTL |
|------|--------|-------|-----|
| A | @ | `76.76.21.21` | 14400 |
| CNAME | www | `cname.vercel-dns.com` | 14400 |
| MX | @ | mx.zoho.com (10) | 14400 |
| MX | @ | mx2.zoho.com (20) | 14400 |
| MX | @ | mx3.zoho.com (50) | 14400 |
| TXT | @ | `v=spf1 include:zohomail.com ~all` | 14400 |
| TXT | @ | `zoho-verification=zb14062891.zmverify.zoho.com` | 14400 |
| TXT | @ | DKIM key | 14400 |

## Reglas inmutables

1. **No cambiar los nameservers** a Vercel ni Cloudflare.
2. **No modificar ni eliminar registros MX, SPF, DKIM ni DMARC** de Zoho.
3. Toda la configuración DNS debe hacerse **manualmente** desde el panel de Hostinger.

Los siguientes registros **no deben modificarse ni eliminarse**:

```
MX: mx.zoho.com (priority 10)
MX: mx2.zoho.com (priority 20)

TXT: v=spf1 include:zoho.com ~all (SPF)
TXT: zoho-verify=... (DKIM)
TXT: v=DMARC1; p=quarantine; ... (DMARC)
```

### 5. Próximos pasos (cuando DNS propague)

- HTTPS con certificado automático de Vercel (se emite tras propagación)
- Redirección www → raíz (automática en Vercel si se configura)
- Verificar health endpoint: `https://comunidadalbas.com.mx/health`
- Verificar correo en `secretaria@comunidadalbas.com.mx`

### 6. Referencia

- Panel Hostinger DNS: https://hpanel.hostinger.com/dominios/comunidadalbas.com.mx/dns
- Proyecto Vercel: https://vercel.com/comunidadalbas-web1/comunidadalbas-web1/settings
- Repo GitHub: https://github.com/comunidadalbas-web/comunidadalbas-web
