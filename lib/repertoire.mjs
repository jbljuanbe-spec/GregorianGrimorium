// Repertorios: la lista de cantos que un director prepara para una misa o un
// ensayo, en orden, con sus anotaciones.
//
// Sin cuentas ni servidor. Un repertorio vive en el navegador de quien lo
// crea (privado por defecto) y se comparte codificado en el propio enlace, de
// modo que quien lo recibe lo abre sin registrarse. Eso mantiene el sitio
// estático y el coste a cero; la sincronización entre dispositivos con
// permisos ya requeriría backend.

export const SCHEMA_VERSION = 1;

/** Límites para que un enlace compartido no crezca sin control. */
export const LIMITS = { items: 60, note: 280, name: 80 };

export function createRepertoire(name = "Repertorio sin título") {
  return { version: SCHEMA_VERSION, name: clip(name, LIMITS.name), items: [] };
}

export function addChant(repertoire, id) {
  if (!id) return repertoire;
  if (repertoire.items.length >= LIMITS.items) return repertoire;
  // Una pieza no se repite dentro del mismo repertorio: si ya está, no se
  // duplica la fila, que es lo que confundiría al abrirlo en el atril.
  if (repertoire.items.some((item) => item.id === id)) return repertoire;

  return { ...repertoire, items: [...repertoire.items, { id, note: "" }] };
}

export function removeChant(repertoire, index) {
  return { ...repertoire, items: repertoire.items.filter((_, position) => position !== index) };
}

export function moveChant(repertoire, index, offset) {
  const target = index + offset;
  if (index < 0 || index >= repertoire.items.length) return repertoire;
  if (target < 0 || target >= repertoire.items.length) return repertoire;

  const items = [...repertoire.items];
  [items[index], items[target]] = [items[target], items[index]];
  return { ...repertoire, items };
}

export function annotate(repertoire, index, note) {
  const items = repertoire.items.map((item, position) =>
    position === index ? { ...item, note: clip(note, LIMITS.note) } : item,
  );
  return { ...repertoire, items };
}

export function rename(repertoire, name) {
  return { ...repertoire, name: clip(name, LIMITS.name) };
}

/**
 * Codifica el repertorio para un enlace. Se usa una tupla compacta en vez del
 * objeto entero porque el enlace se comparte por WhatsApp o correo y las
 * claves repetidas engordarían la URL sin aportar nada.
 */
export function encodeRepertoire(repertoire) {
  const tuple = [
    SCHEMA_VERSION,
    repertoire.name,
    repertoire.items.map((item) => (item.note ? [item.id, item.note] : [item.id])),
  ];
  return encodeURIComponent(JSON.stringify(tuple));
}

/**
 * Decodifica un repertorio venido de un enlace. La entrada no es de fiar
 * —cualquiera puede manipular la URL—, así que se valida la forma campo a
 * campo y se recorta a los límites en vez de confiar en lo que llegue.
 *
 * @returns el repertorio, o null si el enlace no es válido.
 */
export function decodeRepertoire(encoded) {
  if (!encoded) return null;

  let tuple;
  try {
    tuple = JSON.parse(decodeURIComponent(encoded));
  } catch {
    return null;
  }

  if (!Array.isArray(tuple) || tuple.length < 3) return null;
  const [version, name, items] = tuple;
  if (version !== SCHEMA_VERSION || typeof name !== "string" || !Array.isArray(items)) return null;

  const clean = [];
  for (const entry of items.slice(0, LIMITS.items)) {
    const [id, note] = Array.isArray(entry) ? entry : [entry];
    // Los identificadores son slugs; cualquier otra cosa se descarta en vez
    // de terminar en una ruta.
    if (typeof id !== "string" || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) continue;
    clean.push({ id, note: typeof note === "string" ? clip(note, LIMITS.note) : "" });
  }

  return { version: SCHEMA_VERSION, name: clip(name, LIMITS.name), items: clean };
}

function clip(value, max) {
  return String(value ?? "").slice(0, max);
}
