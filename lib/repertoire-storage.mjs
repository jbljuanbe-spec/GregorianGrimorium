// Persistencia de repertorios en el navegador.
//
// Son privados: viven solo en el dispositivo de quien los crea, no se envían
// a ningún servidor (no hay servidor). Para pasarlos a otra persona o a otro
// dispositivo se usa el enlace compartido de lib/repertoire.mjs.
//
// Cada lectura y escritura va protegida: en ventana privada o con el
// almacenamiento bloqueado, el acceso lanza excepción, y el sitio tiene que
// seguir funcionando.

const KEY = "gg.repertorios.v1";
const ACTIVE = "gg.repertorio-activo.v1";

export function readAll() {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveRepertoire(key, repertoire) {
  try {
    const all = readAll();
    all[key] = repertoire;
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // Sin almacenamiento el repertorio sigue vivo en memoria y se puede
    // compartir por enlace; no se interrumpe el trabajo.
  }
}

export function removeRepertoire(key) {
  try {
    const all = readAll();
    delete all[key];
    window.localStorage.setItem(KEY, JSON.stringify(all));
    if (getActiveKey() === key) setActiveKey(null);
  } catch {
    /* ídem */
  }
}

export function getActiveKey() {
  try {
    return window.localStorage.getItem(ACTIVE);
  } catch {
    return null;
  }
}

export function setActiveKey(key) {
  try {
    if (key) window.localStorage.setItem(ACTIVE, key);
    else window.localStorage.removeItem(ACTIVE);
  } catch {
    /* ídem */
  }
}

export function newKey() {
  return `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
