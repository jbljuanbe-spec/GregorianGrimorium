# /seguimiento — Tracker de candidaturas

Uso: `/seguimiento` (ver estado) · `/seguimiento add …` · `/seguimiento update …`

Gestiona `seguimiento/candidaturas.csv`.

## Columnas

`fecha,empresa,puesto,ubicacion,via,cv_usado,estado,enlace,notas`

Estados: `preparada` · `enviada` · `respuesta` · `entrevista` · `oferta` · `rechazada` · `descartada`.

## Reglas

- Una fila por candidatura. Al preparar con `/aplicar` o `/espontanea` → `preparada`.
- Tras el OK de Juan y el envío/subida → `enviada` con la fecha.
- No duplicar la misma vacante (misma URL/empresa+puesto).
- Al consultar, mostrar un resumen: nº por estado y próximas acciones (seguimientos pendientes,
  entrevistas).
