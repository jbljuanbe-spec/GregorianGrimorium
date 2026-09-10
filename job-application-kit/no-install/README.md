# Autofill sin instalar nada (bookmarklet)

Para cuando **no puedes instalar ni descargar software** (p. ej. portátil de trabajo bloqueado).
Es un **marcador del navegador** que rellena el formulario de candidatura de un clic, en tu Chrome
ya logueado, sobre la página real del portal. **No instala nada, no descarga nada, no es una
extensión.**

## Cómo ponerlo (una vez, 30 segundos)

1. Abre `bookmarklet.txt` y copia **toda** la línea (empieza por `javascript:`).
2. En Chrome: menú **⋮ → Marcadores → Crear marcador nuevo** (o Ctrl/Cmd+D en cualquier página).
3. **Nombre:** `Rellenar candidatura`. **URL:** pega la línea copiada. Guardar.
   - Si tu Chrome del trabajo no deja pegar `javascript:` al crear el marcador, créalo en un
     marcador cualquiera y luego **edítalo** para pegar la URL (algunos bloquean solo al crear).

## Cómo usarlo

1. Ve a la vacante (Workday o Greenhouse) e **inicia la candidatura** con tu cuenta.
2. Cuando estés en el formulario, pulsa el marcador **Rellenar candidatura**.
3. Rellena nombre, apellidos, email, teléfono, dirección y las preguntas de screening que
   reconoce. Te muestra un aviso con lo que rellenó.
4. **Tú:** adjuntas el CV (botón *Attach*), repasas desplegables, resuelves CAPTCHA/2FA y **envías**.

## Límites honestos

- **No sube el CV**: los navegadores prohíben que un script elija ficheros (seguridad). Lo
  adjuntas tú con *Attach* — 5 segundos.
- **No resuelve CAPTCHA/2FA** ni desplegables raros de país: eso lo haces tú.
- Actúa **solo en la página abierta**, cuando pulsas el marcador. No corre en segundo plano.

## ¿"Siempre activo" / en background?

El bookmarklet es "a un clic cuando estás en la página", que es lo máximo **sin instalar nada**.
Para que se rellene **solo** al cargar cada oferta (siempre activo) hacen falta, y todas implican
instalar algo:

| Opción | Siempre activo | Requiere |
| --- | --- | --- |
| **Bookmarklet** (este) | No (un clic por página) | Nada. Funciona en PC bloqueado. |
| Gestor de userscripts (Tampermonkey) + este script | Sí (auto al cargar) | Instalar una extensión. |
| Extensión propia | Sí | Instalar extensión (Chrome del trabajo suele bloquearlas). |
| Co-piloto Playwright (`../portal-copilot`) en **PC de casa o VM tuya** | Semi, por lotes | Instalar Node en esa máquina (no en la del trabajo). |

**Recomendación:** si puedes instalar **extensiones** de Chrome (aunque no puedas instalar
software en el PC), usa la opción Tampermonkey de abajo — te da "siempre activo". Si ni eso, el
**bookmarklet** funciona sin nada.

## Siempre activo con Tampermonkey (extensión, sin descargar ficheros)

Fichero: **`tampermonkey-autofill.user.js`**.

1. Instala **Tampermonkey** desde la Chrome Web Store (es una extensión normal).
2. Icono de Tampermonkey → **Crear un nuevo script**.
3. Borra la plantilla, **pega todo** el contenido de `tampermonkey-autofill.user.js`, guarda
   (Ctrl/Cmd+S).
4. Abre cualquier oferta de Workday/Greenhouse: aparece abajo a la derecha el botón **⚡ Rellenar**.
   Marca la casilla **auto** si quieres que rellene solo al cargar cada página.

Ventaja sobre el bookmarklet: se inyecta **en cada página automáticamente**, así que en los
formularios de varios pasos de Workday tienes el botón siempre a mano (o el modo auto). Sigue sin
subir el CV ni resolver CAPTCHA: eso lo haces tú.

## Editar tus datos

Los datos van embebidos en `autofill.js` (objeto `PROFILE`). Si los cambias, regenera el marcador:

```bash
node -e 'const fs=require("fs");let s=fs.readFileSync("autofill.js","utf8").replace(/^\/\*[\s\S]*?\*\/\s*/,"");fs.writeFileSync("bookmarklet.txt","javascript:"+encodeURIComponent(s)+"\n")'
```
