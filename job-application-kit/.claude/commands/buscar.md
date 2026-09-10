# /buscar — Descubrir y priorizar ofertas reales

Uso: `/buscar <sector, rol o empresa> [ubicación|remoto]`

Ejemplos: `/buscar energía desarrollo de negocio España`, `/buscar business analyst remoto`,
`/buscar Iberdrola`.

## Fuentes (solo legítimas)

- El buscador de este repo (`standalone/`) y sus fuentes autorizadas: Adzuna, Arbeitnow,
  Jobicy, y conectores oficiales de Workday (Iberdrola, Santander, Acciona, Enagás…).
- WebSearch / WebFetch sobre los **portales oficiales** de `empresas/empresas-objetivo.md`.
- Enlaces de consulta manual (LinkedIn, InfoJobs, Indeed, Empléate) como destinos, sin scraping
  de sesiones personales.

## Reglas

- Solo ofertas con **URL de origen verificable** y descripción disponible. Nada inventado.
- Deduplicar por URL canónica y, si existe, por ID de requisición ATS.
- Territorio: España o remoto (Italia/EMEA como extensión). Ubicación distinta = «revisar»,
  no descarte.
- Filtrar por experiencia solo si el mínimo de años pedido supera claramente el de Juan.

## Salida

Lista priorizada por encaje. Por cada oferta: empresa · puesto · ubicación/modalidad · fuente ·
URL · encaje (fortalezas/carencias) · CV sugerido · vía (portal/email). Marcar las 3-5 con mejor
encaje para pasar a `/aplicar`.
