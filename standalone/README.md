# Byscador autónomo

Esta carpeta contiene la versión que se despliega fuera de Manus. La interfaz estática se publica con GitHub Pages y consulta APIs públicas directamente desde el navegador. El perfil, las ofertas abiertas y el historial de URLs vistas se guardan en almacenamiento local del dispositivo.

## Fuentes

La versión inicial consulta Arbeitnow y Jobicy sin claves. Adzuna se habilitará posteriormente mediante el Worker incluido, para que su clave gratuita nunca llegue al navegador. Nunca añadas `.dev.vars` a GitHub.

## Pruebas locales

```bash
node --test standalone/tests/worker.test.mjs
```

## Despliegue

El flujo `.github/workflows/deploy-standalone.yml` publica `standalone/public` en GitHub Pages después de habilitar Pages con **GitHub Actions** en la configuración del repositorio. Para una versión con Adzuna, instala Wrangler y publica el Worker desde esta carpeta:

```bash
npx wrangler deploy
```

Para automatizar desde GitHub, configura `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID` como secretos del repositorio y añade un flujo que ejecute `npx wrangler deploy` en cada cambio validado de `main`.
