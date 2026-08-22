# Byscador autónomo

Esta carpeta contiene la versión que se despliega fuera de Manus. La interfaz estática se publica gratuitamente mediante Cloudflare Workers y consulta APIs públicas directamente desde el navegador. El perfil, las ofertas abiertas y el historial de URLs vistas se guardan en almacenamiento local del dispositivo.

## Fuentes

La versión inicial consulta Arbeitnow y Jobicy sin claves. Adzuna se habilitará posteriormente mediante el Worker incluido, para que su clave gratuita nunca llegue al navegador. Nunca añadas `.dev.vars` a GitHub.

## Pruebas locales

```bash
node --test standalone/tests/worker.test.mjs
```

## Despliegue

Cloudflare Workers Builds puede conectar el repositorio privado de GitHub y publicar el proyecto sin GitHub Pages. El archivo `wrangler.toml` de la raíz fija el Worker autónomo y los archivos estáticos correctos, evitando la detección automática de Vite. Para un despliegue manual:

```bash
npx wrangler deploy
```

También hay un generador reproducible para empaquetar la interfaz como un único Worker:

```bash
node standalone/scripts/build-inline-worker.mjs
```

Cloudflare puede mantener el enlace al repositorio privado y crear una publicación nueva con cada cambio en `main`; no es necesario abrir el repositorio ni utilizar GitHub Pages.
