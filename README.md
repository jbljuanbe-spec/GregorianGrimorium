# Byscador de Ofertas España

Aplicación privada para organizar una búsqueda de empleo en España con criterios profesionales explícitos. Permite registrar oportunidades reales desde portales, redes profesionales o páginas de empleo corporativas; compara sus requisitos con el perfil personal y prioriza las más alineadas.

## Capacidades

| Área | Implementación |
| --- | --- |
| Perfil privado | Titular, experiencia sintetizada, competencias, preferencias, idiomas y palabras clave editables. |
| Catálogo | Registro de ofertas con fuente, URL original, ubicación, modalidad, contrato, área, fecha, requisitos y notas. |
| Búsqueda | Filtros por texto, ubicación, modalidad, contrato, área, fecha y estado personal. |
| Adecuación | Puntuación explicable sobre 100; muestra coincidencias, carencias y el detalle de los factores de cálculo. |
| Seguimiento | Estados: pendiente, favorita, aplicada y descartada. |
| Comparación | Comparación lado a lado de dos o tres ofertas seleccionadas. |

## Modelo de adecuación

La plataforma no inventa competencias. El cálculo se limita a contrastar el texto de cada oferta con los criterios editables del perfil y presenta las dudas en lugar de ocultarlas.

| Factor | Peso máximo |
| --- | ---: |
| Competencias y palabras clave | 45 puntos |
| Puesto y sector objetivo | 25 puntos |
| Ubicación, modalidad y contrato | 15 puntos |
| Idiomas | 10 puntos |

## Uso

Después de iniciar sesión, revisa primero **Mi perfil** y ajusta las palabras clave a tu experiencia demostrable. Desde **Ofertas**, abre una fuente externa o un portal de empresa, copia la información esencial de una oportunidad real y conserva su URL de candidatura. El sistema calcula la adecuación, permite asignar un estado y mantiene las ofertas seleccionadas para el **Comparador**.

Los enlaces de consulta iniciales incluyen [Empléate](https://www.empleate.gob.es/empleo/#/), [InfoJobs](https://www.infojobs.net/), [LinkedIn Empleos](https://es.linkedin.com/jobs) e [Indeed España](https://es.indeed.com/). La vigencia de una oferta y las condiciones definitivas deben confirmarse siempre en la fuente original.

## Desarrollo local

```bash
pnpm install
pnpm dev
pnpm check
pnpm test
```

El proyecto usa React, Express, tRPC, Drizzle y autenticación integrada. El perfil y las ofertas se protegen mediante procedimientos autenticados y se guardan por usuario.

## Calidad y privacidad

La batería de pruebas cubre la puntuación de adecuación, filtros, estados de candidatura y control de acceso. La aplicación no automatiza candidaturas, no solicita credenciales de portales externos y guarda solo el enlace de origen elegido por el usuario.

Las decisiones de arquitectura y las fuentes de consulta están documentadas en [`docs/architecture.md`](docs/architecture.md).

## Referencia

La idea de convertir una búsqueda de empleo en un proceso explícito y verificable tomó como referencia conceptual el proyecto [MadsLorentzen/ai-job-search](https://github.com/MadsLorentzen/ai-job-search), publicado bajo licencia MIT. Esta aplicación es una implementación web independiente, enfocada en una gestión privada de oportunidades en España.
