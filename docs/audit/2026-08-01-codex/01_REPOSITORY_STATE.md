# Estado del repositorio

- Raíz: `C:\Users\rbori\OneDrive\Desktop\comunidadalbas`
- Rama inicial: `feature/portal-administracion-comunitaria-v1`
- Commit inicial: `d08ec5a5894c7df2917ffa7e28ffad14e333dd21`
- Remoto: `https://github.com/comunidadalbas-web/comunidadalbas-web.git`
- Gestor: pnpm 10.17.0; lockfile `pnpm-lock.yaml`
- Node local: v24.17.0
- Rama remota de producción observable: `main` en `5a5f09a906dfa8c97a2dfdd59048d8ad5f527ca3`
- La rama local no tiene upstream y no existe en el remoto.

El árbol inicial contenía 14 archivos rastreados modificados, un middleware eliminado y 28 archivos nuevos. Son trabajo preexistente y se conservaron. No se usó stash, reset, clean, checkout destructivo ni force push.

CI sólo se activa en `main`, `bootstrap/**` y pull requests hacia `main`; la rama `feature/**` no activa el workflow por push según `.github/workflows/ci.yml`. Vercel está vinculado al proyecto `comunidadalbas-web1`; la rama de producción debe confirmarse en su configuración antes de publicar.
