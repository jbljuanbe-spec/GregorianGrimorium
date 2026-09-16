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

Fase 1 — prototipo editorial. El pipeline de importación desde gabc está
construido y probado; el corpus está vacío a la espera del gate de licencia
de Fase 0 (ver [`docs/PLAN.md`](docs/PLAN.md)). Todavía no hay frontend.

```sh
pnpm install
pnpm run check   # tests + validación del corpus
```

## Estructura

```
data/chants/   Datos maestros de cantos (JSON), fuente de verdad en git
data/schema/   Esquema JSON del registro de canto
docs/          Auditoría, plan de fases, fuentes, guía de importación
scripts/       Importación desde gabc y validación del corpus
app/           Frontend Next.js (Fase 2)
```
