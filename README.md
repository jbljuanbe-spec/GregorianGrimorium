# Byscador de Ofertas España

Aplicación privada para descubrir, deduplicar y priorizar oportunidades reales en España con criterios profesionales explícitos. Compara el texto de cada oferta con el perfil guardado en el navegador y conserva el enlace original de candidatura.

## Acceso independiente

La versión autónoma, que no requiere créditos de Manus para usarse, está disponible en **[buscador-ofertas-espana.jbljuanbe.workers.dev](https://buscador-ofertas-espana.jbljuanbe.workers.dev)**. El código permanece en este repositorio privado y Cloudflare publica las actualizaciones de `main` gratuitamente.

Esta versión consulta fuentes compatibles bajo demanda y ordena las vacantes según el perfil guardado localmente en el navegador. Deduplica la misma URL canónica de candidatura y, cuando una fuente expone un identificador de requisición ATS, la misma requisición sindicada en otra URL. Por tanto, conserva posiciones distintas de una misma empresa, incluso cuando comparten ciudad o título. No depende de créditos de Manus ni envía el CV a un servidor.

## Cobertura de fuentes

| Fuente | Estado | Cobertura efectiva |
| --- | --- | --- |
| [Adzuna](https://developer.adzuna.com/overview) | Activa cuando el Worker tiene sus credenciales configuradas como secretos. | Ofertas españolas agregadas; la consulta se amplía de forma controlada cuando el texto es demasiado específico. |
| [Arbeitnow](https://www.arbeitnow.com/api/job-board-api) | Fuente pública complementaria. | Vacantes con presencia en España y algunas oportunidades remotas si se activan. |
| [Jobicy](https://jobicy.com/api/v2/remote-jobs) | Fuente pública complementaria. | Oportunidades remotas; se muestran solo cuando se habilita esa modalidad. |
| [Iberdrola Careers](https://iberdrola.wd3.myworkdayjobs.com/en-US/Iberdrola) | Conector corporativo oficial activo. | Consulta paginada y acotada del ATS público de Iberdrola; se retienen las vacantes con señal de España y se enlaza la candidatura original. |
| [Santander Careers](https://santander.wd3.myworkdayjobs.com/en/SantanderCareers) | Conector corporativo oficial activo. | Consulta paginada y acotada del ATS público de Santander; se retienen las vacantes con señal de España y se enlaza la candidatura original. |
| Radar de 100 empresas objetivo | Activo como directorio de carrera. | Enlaces a los portales oficiales; solo las empresas con conector marcado como fuente se consultan automáticamente. |

> **Transparencia de cobertura.** LinkedIn, Google Jobs, InfoJobs e Indeed se facilitan como destinos de consulta manual cuando corresponda. La aplicación no automatiza su extracción ni utiliza sesiones personales sin una autorización o API aplicable.

## Capacidades

| Área | Implementación |
| --- | --- |
| Perfil privado | Importación local de CV `.pdf`, `.docx`, `.txt` o `.md`; titular, experiencia, áreas, ubicaciones, idiomas y palabras clave editables. |
| Búsqueda activa | Consulta de fuentes autorizadas bajo demanda, deduplicación por URL y empresa/título/ubicación, e historial local de consultas. |
| Adecuación | Puntuación explicable sobre 100; muestra coincidencias, carencias, experiencia solicitada, empresa objetivo y ubicación a revisar. |
| Filtro de experiencia | Opción para ocultar solo las ofertas cuyo requisito de años conocido supera la experiencia extraída o declarada. |
| Radar corporativo | Directorio de cien organizaciones objetivo con enlaces oficiales de empleo y prioridad adicional para sus resultados recuperados. |

## Modelo de adecuación

La plataforma no inventa competencias. El cálculo se limita a contrastar el texto de cada oferta con los criterios editables del perfil y presenta las dudas en lugar de ocultarlas. Una ubicación distinta no elimina una oportunidad sólida: queda señalada como **ubicación por revisar** y recibe una penalización moderada.

| Factor | Peso máximo |
| --- | ---: |
| Competencias, roles, áreas y palabras clave | 75 puntos |
| Ubicación, modalidad y contrato | 15 puntos |
| Idiomas | 10 puntos |
| Empresa objetivo y experiencia suficiente | 15 puntos combinados |

## Uso

Abre la [versión autónoma](https://buscador-ofertas-espana.jbljuanbe.workers.dev), importa el CV desde el dispositivo si quieres partir del documento y revisa los campos extraídos. Después selecciona las fuentes, activa el filtro de experiencia si procede y busca. El buscador muestra las fuentes consultadas, elimina duplicados, calcula la adecuación y abre siempre la URL original para la candidatura.

Los enlaces de consulta manual incluyen [Empléate](https://www.empleate.gob.es/empleo/#/), [InfoJobs](https://www.infojobs.net/), [LinkedIn Empleos](https://es.linkedin.com/jobs) e [Indeed España](https://es.indeed.com/). La vigencia de cualquier oferta y las condiciones definitivas deben confirmarse siempre en la fuente original.

## Desarrollo local

```bash
pnpm install
pnpm dev
pnpm check
pnpm test
```

El proyecto usa React, Express, tRPC, Drizzle y autenticación integrada. El perfil y las ofertas se protegen mediante procedimientos autenticados y se guardan por usuario.

## Calidad y privacidad

La batería de pruebas cubre deduplicación, normalización de keywords, extracción local de CV, requisitos de experiencia, ranking real, historial seguro y el conector corporativo oficial. La aplicación no automatiza candidaturas ni solicita credenciales de portales externos.

Las decisiones de arquitectura y las fuentes de consulta están documentadas en [`docs/architecture.md`](docs/architecture.md).

## Referencia

La idea de convertir una búsqueda de empleo en un proceso explícito y verificable tomó como referencia conceptual el proyecto [MadsLorentzen/ai-job-search](https://github.com/MadsLorentzen/ai-job-search), publicado bajo licencia MIT. Esta aplicación es una implementación web independiente, enfocada en una gestión privada de oportunidades en España.
