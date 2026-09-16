# Plan de ejecución

El criterio para avanzar de fase no es el número de cantos procesados, sino
haber demostrado que el proceso produce fichas correctas y que un usuario
real encuentra lo que busca.

## Fase 0 — Validación (actual)

- [x] Estructura del repo, esquema de datos, documentación de fuentes.
- [ ] Verificar manualmente términos de licencia de GregoBase (bloqueado
      por red en este entorno, ver `SOURCES.md`).
- [ ] Seleccionar 20-30 cantos representativos para el prototipo.
- [ ] Confirmar que un registro puede pasar de `draft` a `verified` con el
      esquema actual sin fricción.

## Fase 1 — Prototipo editorial

- [ ] Script de importación desde GregoBase (o fuente equivalente) a
      `data/chants/*.json` conforme al esquema.
- [ ] `scripts/validate-data.mjs` como gate obligatorio (ya presente,
      ejecutar en CI).
- [ ] Flujo de revisión manual (aunque sea una hoja de cálculo o checklist)
      y medición de tiempo de revisión por canto.

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
