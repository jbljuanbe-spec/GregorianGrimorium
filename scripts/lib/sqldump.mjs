// Lector de volcados mysqldump.
//
// GregoBaseCorpus distribuye la base de GregoBase como volcado SQL. El gabc
// que contiene está lleno de paréntesis, comas, comillas y saltos de línea
// escapados, así que las sentencias INSERT hay que tokenizarlas de verdad:
// partir por comas rompe los datos.

const ESCAPES = new Map([
  ["n", "\n"],
  ["r", "\r"],
  ["t", "\t"],
  ["0", "\0"],
  ["b", "\b"],
  ["Z", ""],
]);

// Devuelve las filas de una tabla como objetos, usando la lista de columnas
// declarada en cada INSERT.
export function readTable(dump, table) {
  const rows = [];
  const header = new RegExp(`INSERT INTO \`${table}\`\\s*\\(([^)]*)\\)\\s*VALUES`, "g");

  for (const match of dump.matchAll(header)) {
    const columns = match[1].split(",").map((name) => name.trim().replace(/`/g, ""));
    const { tuples } = readTuples(dump, match.index + match[0].length);
    for (const tuple of tuples) {
      const row = {};
      columns.forEach((column, index) => {
        row[column] = tuple[index] ?? null;
      });
      rows.push(row);
    }
  }
  return rows;
}

// Lee `(...),(...),...;` a partir de una posición dada.
function readTuples(dump, start) {
  const tuples = [];
  let position = start;
  let current = null;
  let value = null;
  let inString = false;

  while (position < dump.length) {
    const char = dump[position];

    if (inString) {
      if (char === "\\") {
        const next = dump[position + 1];
        value += ESCAPES.has(next) ? ESCAPES.get(next) : next;
        position += 2;
        continue;
      }
      // Una comilla duplicada ('') dentro de una cadena es una comilla literal.
      if (char === "'" && dump[position + 1] === "'") {
        value += "'";
        position += 2;
        continue;
      }
      if (char === "'") {
        inString = false;
        current.push(value);
        value = null;
        position += 1;
        continue;
      }
      value += char;
      position += 1;
      continue;
    }

    if (char === "'") {
      inString = true;
      value = "";
      position += 1;
      continue;
    }
    if (char === "(") {
      current = [];
      position += 1;
      continue;
    }
    if (char === ")") {
      flushBareValue(current, value);
      value = null;
      tuples.push(current);
      current = null;
      position += 1;
      continue;
    }
    if (char === "," && current) {
      flushBareValue(current, value);
      value = null;
      position += 1;
      continue;
    }
    if (char === ";") break;

    if (current && !/\s/.test(char)) {
      value = (value ?? "") + char;
    }
    position += 1;
  }

  return { tuples, end: position };
}

// Los valores sin comillas son NULL o números.
function flushBareValue(tuple, value) {
  if (value === null || value === undefined) return;
  const bare = value.trim();
  if (!bare) return;
  tuple.push(bare.toUpperCase() === "NULL" ? null : bare);
}
