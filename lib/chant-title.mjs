/**
 * El título con el que se presenta una pieza.
 *
 * Vive aquí, en un módulo suelto, porque lo necesitan dos mundos: las páginas
 * (TypeScript) y el generador del índice de búsqueda (un script .mjs). Una
 * sola definición para que el buscador, el raíl y la ficha no puedan acabar
 * llamando a la misma pieza de dos maneras.
 *
 * El caso que lo motiva: los 705 Alleluia del corpus vienen titulados por su
 * VERSÍCULO, no por la palabra «Alleluia». La fuente hace bien —los 705
 * empiezan cantando «Allelúia», así que titularlos todos igual daría 705
 * filas indistinguibles—, pero enseñarlo crudo desconcierta: se lee «In
 * multitudine» con la etiqueta «Alleluia» al lado y no parece que tengan que
 * ver.
 *
 * Los libros lo imprimen con la relación a la vista —«Allelúia: In
 * multitúdine»—, y eso es lo que se muestra. El íncipit crudo se conserva
 * intacto en los datos, y sigue siendo lo que se busca y por lo que se ordena.
 */
export function displayTitle(chant) {
  if (chant.genre !== "Alleluia") return chant.incipit;
  // Los dos que ya vienen titulados «Allelúia…» se dejan como están.
  if (/^all?el/i.test(chant.incipit)) return chant.incipit;
  return `Allelúia: ${chant.incipit}`;
}
