# Gregorian Grimorium

Biblioteca digital de canto gregoriano: un buscador donde directores de coro,
organistas, músicos de iglesia e investigadores localizan una pieza por
íncipit, modo o celebración litúrgica y consultan su partitura.

## Principio de diseño

No se persigue transcripción musical completa (MIDI/MusicXML). El objetivo es
ofrecer una imagen fiel de la partitura junto a metadata estructurada y
verificada. Ver [`docs/AUDIT.md`](docs/AUDIT.md) para el análisis de
viabilidad y [`docs/PLAN.md`](docs/PLAN.md) para el plan de ejecución por
fases.

## Fuente del corpus

El prototipo se construye sobre fuentes de dominio público / licencia abierta
(GregoBase, ediciones anteriores a 1929), **no** sobre el *Graduale Triplex*
(1979, Solesmes), cuya edición está protegida. Ver
[`docs/SOURCES.md`](docs/SOURCES.md).

## Estado

Fase 0 — validación. Aún no hay pipeline de datos ni frontend funcional; este
commit establece la estructura del proyecto, el esquema de datos y el plan.

## Estructura

```
data/       Datos maestros de cantos (JSON), fuente de verdad versionada en git
docs/       Auditoría, plan de fases, esquema de datos, fuentes
scripts/    Herramientas de importación/validación (a construir en Fase 1)
app/        Frontend Next.js (a construir en Fase 2)
```
