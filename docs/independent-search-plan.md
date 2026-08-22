# Plan de búsqueda activa independiente

## Objetivo

La aplicación debe recuperar ofertas reales bajo demanda, conservar su URL de origen, deduplicarlas y priorizarlas frente al perfil profesional. El código y la configuración se mantendrán en el repositorio privado; el uso cotidiano no requerirá créditos de Manus.

## Fuentes verificadas

| Fuente | Uso previsto | Requisito de integración |
| --- | --- | --- |
| [Adzuna API](https://developer.adzuna.com/overview) | Búsqueda estructurada de ofertas en España y enlaces de origen. | Credenciales de API del titular de la cuenta. |
| [Arbeitnow](https://www.arbeitnow.com/api/job-board-api) | Fuente pública complementaria. | Consulta bajo demanda sin clave. |
| [Jobicy](https://jobicy.com/api/v2/remote-jobs) | Fuente pública complementaria para remoto. | Consulta bajo demanda sin clave; requiere activar remoto para presentar resultados. |
| [Iberdrola Careers](https://iberdrola.wd3.myworkdayjobs.com/en-US/Iberdrola) | Primer conector corporativo oficial. | Feed público de Workday; recuperación acotada y paginada, con filtro posterior de España. |
| [Santander Careers](https://santander.wd3.myworkdayjobs.com/en/SantanderCareers) | Segundo conector corporativo oficial. | Feed público de Workday; recuperación acotada y paginada, con filtro posterior de España. |
| [Empléate](https://www.empleate.gob.es/empleo/#/) | Fuente pública estatal y enlace de consulta. | Se mantiene como fuente enlazada hasta confirmar una interfaz programática autorizada. |
| Portales corporativos | Búsqueda dirigida en empresas objetivo y URL de candidatura. | Conectores individuales únicamente si existe API pública o feed autorizado. |

## Flujo propuesto

La búsqueda utiliza las consultas del perfil —roles objetivo, sectores, ubicación y palabras clave— para pedir resultados a cada fuente configurada. Normaliza título, empresa, ubicación, modalidad, fecha y URL. Antes de presentar, elimina duplicados por URL canónica y, cuando esté disponible, por identificador de requisición ATS de la misma empresa. No agrupa por empresa, puesto y ubicación, ya que esa combinación puede representar requisiciones distintas. Después aplica el mismo modelo de adecuación explicable de Byscador y muestra la fuente realmente consultada en cada resultado.

## Límites explícitos

No se automatizarán candidaturas, no se usarán sesiones personales de LinkedIn u otros portales, y no se extraerán ofertas de sitios que no ofrezcan una API o acceso autorizado. Las claves de proveedores se configurarán como secretos del entorno de despliegue, nunca se guardarán en el repositorio.

## Comparativa de alternativas sin coste inicial

| Alternativa | Coste inicial | Cobertura y límites | Decisión para Byscador |
| --- | --- | --- | --- |
| Adzuna | Gratis dentro de su cuota estándar. | Agregador estructurado con cobertura española y límites publicados por solicitud. | Fuente principal recomendada para puestos generalistas en España. |
| Arbeitnow | API pública sin clave. | Orientada a ofertas tecnológicas y de ATS; la cobertura española no sustituye a un agregador local. | Fuente opcional para oportunidades tech, remotas o de empresas con ATS. |
| Jooble | La documentación exige clave de API. | Cobertura agregada amplia; el acceso gratuito y sus cuotas deben confirmarse en el registro de la cuenta. | Fuente secundaria opcional, no base del diseño gratuito. |
| Empléate | Consulta pública. | Agregador público estatal; no se ha confirmado una API pública de integración. | Enlace y búsqueda dirigida hasta disponer de una interfaz autorizada. |

La combinación inicial más sólida sin pago es **Adzuna para España**, con **Arbeitnow** y **Jobicy** como complementos públicos, e **Iberdrola Careers** y **Santander Careers** como fuentes corporativas verificables. Los cien portales del radar no equivalen a cien conectores: solo los conectores que aparecen como fuente de búsqueda recuperan vacantes automáticamente. Ninguna alternativa permite recopilar legítimamente "todo" InfoJobs, LinkedIn, Google Jobs e Indeed sin las condiciones o acuerdos de cada portal.

## Patrones adaptados del repositorio MIT

El flujo adopta la separación entre **descubrimiento**, **validación**, **ranking** y **seguimiento**. Una consulta recupera resultados; solo una ficha con URL de origen y descripción disponible puede recibir puntuación. No se valoran ni presentan vacantes inventadas, rotas o con información insuficiente.

La deduplicación se ejecuta antes de clasificar: primero por URL canónica y, si no existe, por empresa, título y ubicación normalizados. Las ofertas ya guardadas o aplicadas se conservan como historial, pero no se repiten como nuevos resultados. Los resultados se ordenan por adecuación y se separan los descartados por reglas excluyentes en vez de ocultarlos.

> Las preferencias de ubicación se ponderan, no son vetos por defecto. Una oferta fuera de la preferencia se marca como revisión y recibe una penalización moderada; solo una regla explícita del perfil debería excluirla.

El ranking seguirá mostrando fortalezas y carencias concretas. Una fecha límite cercana puede romper empates, pero no compensa una incompatibilidad de ubicación, idioma o condición marcada como excluyente en el perfil.

## Seguridad aplicada a ofertas externas

Las descripciones de puestos, títulos y requisitos son datos de terceros no confiables. El buscador no ejecuta instrucciones incluidas en una oferta, no sigue enlaces embebidos en el texto y solo consulta la URL de origen que devuelve una fuente configurada. Las claves de proveedores se mantienen como secretos del entorno y no se registran en resultados, registros ni GitHub. El sistema solo guarda metadatos de las ofertas y enlaces de candidatura; no automatiza envíos, no solicita credenciales de portales y no utiliza sesiones personales de redes profesionales.

## Arquitectura autónoma propuesta

La versión independiente se alojará como un Worker con archivos estáticos, desplegable desde el repositorio privado. El navegador conservará el perfil, las preferencias, las ofertas guardadas y el historial de deduplicación en almacenamiento local del dispositivo. Con ello, las búsquedas públicas no envían el CV ni los datos de seguimiento a una base de datos central.

El Worker actúa como pasarela de búsqueda para proteger las claves opcionales y ejecutar conectores corporativos autorizados. Consulta Adzuna cuando se configure una credencial de proveedor como secreto de entorno y consulta el feed corporativo público de Iberdrola. Arbeitnow y Jobicy se consultan directamente desde el navegador. Cada respuesta se normaliza a una estructura común y se entrega con URL de candidatura original, fuente y fecha. El ranking se ejecuta en el navegador contra el perfil local.

| Capa | Responsabilidad | Dependencia |
| --- | --- | --- |
| Interfaz estática | Perfil, criterios, resultados, comparación y seguimiento local. | Navegador del usuario. |
| Worker de búsqueda | Consulta autorizada, normalización, límite de resultados y deduplicación de la respuesta. | Cloudflare Workers, con nivel gratuito de inicio. |
| Fuentes públicas | Arbeitnow y Jobicy en navegador; Adzuna e Iberdrola Careers por Worker. | API o feed público de cada proveedor. |
| Persistencia privada | Perfil, lista guardada, estados e historial de URLs consultadas. | `localStorage` del navegador. |

La primera versión se desplegó con fuentes públicas compatibles. Cuando se configura la clave gratuita de Adzuna como secreto, el mismo Worker extiende la cobertura española sin exponerla. Los conectores corporativos se añaden de uno en uno tras verificar sus interfaces públicas; no se simula que el radar de cien empresas sea una búsqueda automática completa.
