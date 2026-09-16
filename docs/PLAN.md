# Plan de ejecución

El criterio para avanzar de fase no es el número de cantos procesados, sino
haber demostrado que el proceso produce fichas correctas y que un usuario
real encuentra lo que busca.

## Fase 0 — Validación · completada

- [x] Estructura del repo, esquema de datos y documentación de fuentes.
- [x] **Licencia verificada**: GregoBase y GregoBaseCorpus son CC0-1.0,
      confirmado en la fuente primaria (ver `SOURCES.md`).
- [x] Esquema capaz de sostener el ciclo de revisión, ejercitado por los
      importadores y sus tests.

## Fase 1 — Prototipo editorial · completada

- [x] Lector del volcado SQL de GregoBase (`lib/sqldump.mjs`), con
      tokenizador real: el gabc está lleno de comas, paréntesis y comillas
      escapadas.
- [x] Importador con procedencia obligatoria (`scripts/import-gregobase.mjs`).
- [x] Importador de archivos `.gabc` sueltos, para transcripciones propias.
- [x] Corpus importado: 3.054 propios de la misa, 0 errores de esquema.
- [x] Validación como gate en CI, junto a tests, tipos y build.

## Fase 2 — MVP web · completada

- [x] Exportación estática (Next.js `output: export`): 3.054 páginas.
- [x] Búsqueda por íncipit **y por cualquier palabra del texto latino**,
      insensible a acentos.
- [x] Filtros por género, modo y edición impresa.
- [x] Partitura dibujada en el cliente desde el gabc, con zoom y reflujo al
      ancho de pantalla; verificada en escritorio y en móvil.
- [x] Sitemap y metadatos por canto.
- [x] Estado de revisión visible en cada ficha.
- [x] Identidad visual propia: tipografía Crimson Text (la misma que lleva la
      letra bajo los neumas) y color según la convención del libro litúrgico,
      tinta negra para lo que se canta y rojo de rúbrica para lo que indica
      cómo cantarlo.
- [x] Datos estructurados (`MusicComposition`), Open Graph, robots y canónicas.
- [x] **Tono y tesitura**: el do se asigna a una nota real, se ve el ámbito
      resultante y se puede dar el tono con audio. Ver `PITCH.md`.
- [x] Modo ensayo a pantalla completa.
- [ ] Prueba con usuarios reales (directores de coro, organistas).

## Fase 3 — Escalado y calidad

- [ ] Revisión humana del primer lote (20-30 cantos) y medición del tiempo
      de revisión por canto.
- [ ] Ampliar el corpus a las 9.135 piezas del volcado (antífonas, himnos,
      responsorios, Kyriale).
- [ ] Cubrir el hueco de celebraciones litúrgicas (ver abajo).
- [ ] Contenido contextual original y relaciones entre piezas.
- [ ] Evaluar tráfico, costes y monetización.

## Huecos de datos conocidos

Medidos sobre los 3.054 registros importados:

| Campo | Cobertura | Consecuencia |
| --- | --- | --- |
| Género | 3.054 (100%) | Filtro fiable |
| Modo | 3.038 (99,5%) | Filtro fiable |
| Edición impresa y página | 3.015 (98,7%) | Filtro fiable |
| Celebración litúrgica | **5 (0,2%)** | **No hay filtro por fiesta** |
| Cantus ID | 14 (0,5%) | Enlace a Cantus Index solo anecdótico |

El hueco de celebraciones es el más importante: en GregoBase las etiquetas
litúrgicas están casi todas en antífonas del Oficio, no en los propios de la
misa. El plan original daba por hecho un filtro por fiesta que los datos no
sostienen. Vías para cubrirlo, por orden de coste:

1. Derivarla del orden del Graduale Romanum: el libro está ordenado por año
   litúrgico, así que la página implica la celebración. Requiere una tabla de
   correspondencia página→celebración por edición.
2. Importarla de Cantus Index para los registros con `cantusid`.
3. Asignación manual durante la revisión humana.

Otra rareza heredada: un registro con íncipit de relleno
(`-- No Incipit (mode 8)`). Es uno entre 3.054 y está en `needs_review`; lo
corrige la revisión, no un caso especial en el código.
