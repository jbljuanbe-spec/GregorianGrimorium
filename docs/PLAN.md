# Plan de ejecución

El criterio para avanzar de fase no es el número de cantos procesados, sino
haber demostrado que el proceso produce fichas correctas y que un usuario
real encuentra lo que busca.

## Fase 0 — Validación

- [x] Estructura del repo, esquema de datos, documentación de fuentes.
- [x] Confirmar que el esquema soporta el ciclo de revisión
      (`needs_review` → `verified`) sin fricción: el importador y sus tests
      lo ejercitan.
- [ ] **Bloqueado (acción humana)**: verificar los términos de licencia de
      GregoBase. El entorno de ejecución de este repo no tiene salida a
      `gregobase.selapa.net` ni a `ccwatershed.org` (403 del proxy de red),
      así que hay que hacerlo desde una máquina con internet abierto.
- [ ] Seleccionar 20-30 cantos representativos para el prototipo.

## Fase 1 — Prototipo editorial

- [x] Pipeline de importación desde **gabc**, el formato de intercambio de
      los corpus abiertos (GregoBase, Gregorio). Ver `IMPORT.md`.
      26 tests en verde, incluida la conformidad con el esquema.
- [x] `scripts/validate-data.mjs` como gate, ejecutado en CI
      (`.github/workflows/ci.yml`).
- [ ] Ejecutar el importador sobre un lote real (depende del gate de
      licencia de Fase 0).
- [ ] Flujo de revisión manual (checklist u hoja de cálculo) y medición del
      tiempo de revisión por canto.
- [ ] Generación de imágenes de partitura con Gregorio a partir del gabc
      (`score_images`), que no deriva de la importación.

## Fase 2 — MVP web

- [ ] Next.js con generación estática por canto (`app/cantos/[id]`).
- [ ] Búsqueda por íncipit, título y texto latino; filtros por género, modo
      y celebración.
- [ ] Visor de partitura con zoom.
- [ ] Sin páginas indexables por combinación de filtros.
- [ ] Prueba con usuarios reales (directores de coro, organistas).

## Fase 3 — Escalado

- [ ] Nuevos lotes de cantos.
- [ ] Relaciones litúrgicas y contenido contextual original.
- [ ] Evaluación de tráfico, costes y monetización (AdSense u otra), solo si
      el contenido ya es útil y autorizado.
