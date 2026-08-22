# Plan de búsqueda activa independiente

## Objetivo

La aplicación debe recuperar ofertas reales bajo demanda, conservar su URL de origen, deduplicarlas y priorizarlas frente al perfil profesional. El código y la configuración se mantendrán en el repositorio privado; el uso cotidiano no requerirá créditos de Manus.

## Fuentes verificadas

| Fuente | Uso previsto | Requisito de integración |
| --- | --- | --- |
| [Adzuna API](https://developer.adzuna.com/overview) | Búsqueda estructurada de ofertas en España y enlaces de origen. | Credenciales de API del titular de la cuenta. |
| [Jooble REST API](https://jooble.org/api/about) | Fuente agregada alternativa para ampliar cobertura. | Clave de API del titular de la cuenta. |
| [Empléate](https://www.empleate.gob.es/empleo/#/) | Fuente pública estatal y enlace de consulta. | Se mantiene como fuente enlazada hasta confirmar una interfaz programática autorizada. |
| Portales corporativos | Búsqueda dirigida en empresas objetivo y URL de candidatura. | Conectores individuales únicamente si existe API pública o feed autorizado. |

## Flujo propuesto

La búsqueda utilizará las consultas del perfil —roles objetivo, sectores, ubicación y palabras clave— para pedir resultados a cada fuente configurada. Normalizará título, empresa, ubicación, modalidad, fecha y URL. Antes de guardar, eliminará duplicados por URL canónica y por combinación de empresa, puesto y ubicación. Después aplicará el mismo modelo de adecuación explicable de Byscador y mostrará la fuente de cada resultado.

## Límites explícitos

No se automatizarán candidaturas, no se usarán sesiones personales de LinkedIn u otros portales, y no se extraerán ofertas de sitios que no ofrezcan una API o acceso autorizado. Las claves de proveedores se configurarán como secretos del entorno de despliegue, nunca se guardarán en el repositorio.

## Comparativa de alternativas sin coste inicial

| Alternativa | Coste inicial | Cobertura y límites | Decisión para Byscador |
| --- | --- | --- | --- |
| Adzuna | Gratis dentro de su cuota estándar. | Agregador estructurado con cobertura española y límites publicados por solicitud. | Fuente principal recomendada para puestos generalistas en España. |
| Arbeitnow | API pública sin clave. | Orientada a ofertas tecnológicas y de ATS; la cobertura española no sustituye a un agregador local. | Fuente opcional para oportunidades tech, remotas o de empresas con ATS. |
| Jooble | La documentación exige clave de API. | Cobertura agregada amplia; el acceso gratuito y sus cuotas deben confirmarse en el registro de la cuenta. | Fuente secundaria opcional, no base del diseño gratuito. |
| Empléate | Consulta pública. | Agregador público estatal; no se ha confirmado una API pública de integración. | Enlace y búsqueda dirigida hasta disponer de una interfaz autorizada. |

La combinación inicial más sólida sin pago es **Adzuna para España**, con **Arbeitnow** como fuente complementaria sin clave. Jooble puede añadirse cuando el usuario confirme que su cuenta ofrece cuota gratuita suficiente. Ninguna alternativa permite recopilar legítimamente "todo" InfoJobs, LinkedIn e Indeed sin las condiciones o acuerdos de cada portal.

## Patrones adaptados del repositorio MIT

El flujo adopta la separación entre **descubrimiento**, **validación**, **ranking** y **seguimiento**. Una consulta recupera resultados; solo una ficha con URL de origen y descripción disponible puede recibir puntuación. No se valoran ni presentan vacantes inventadas, rotas o con información insuficiente.

La deduplicación se ejecuta antes de clasificar: primero por URL canónica y, si no existe, por empresa, título y ubicación normalizados. Las ofertas ya guardadas o aplicadas se conservan como historial, pero no se repiten como nuevos resultados. Los resultados se ordenan por adecuación y se separan los descartados por reglas excluyentes en vez de ocultarlos.

> Los vetos no son una reducción de puntos: una oferta que exige una ubicación incompatible o un idioma no declarado queda fuera de la lista prioritaria y se explica el motivo.

El ranking seguirá mostrando fortalezas y carencias concretas. Una fecha límite cercana puede romper empates, pero no compensa una incompatibilidad de ubicación, idioma o condición marcada como excluyente en el perfil.

## Seguridad aplicada a ofertas externas

Las descripciones de puestos, títulos y requisitos son datos de terceros no confiables. El buscador no ejecuta instrucciones incluidas en una oferta, no sigue enlaces embebidos en el texto y solo consulta la URL de origen que devuelve una fuente configurada. Las claves de proveedores se mantienen como secretos del entorno y no se registran en resultados, registros ni GitHub. El sistema solo guarda metadatos de las ofertas y enlaces de candidatura; no automatiza envíos, no solicita credenciales de portales y no utiliza sesiones personales de redes profesionales.

## Arquitectura autónoma propuesta

La versión independiente se alojará como un Worker con archivos estáticos, desplegable desde el repositorio privado. El navegador conservará el perfil, las preferencias, las ofertas guardadas y el historial de deduplicación en almacenamiento local del dispositivo. Con ello, las búsquedas públicas no envían el CV ni los datos de seguimiento a una base de datos central.

El Worker únicamente actuará como pasarela de búsqueda para evitar restricciones de navegador y proteger claves opcionales. Consultará Arbeitnow y Jobicy sin clave y podrá consultar Adzuna cuando se configure una credencial de proveedor como secreto de entorno. Cada respuesta se normaliza a una estructura común y se entrega con URL de candidatura original, fuente y fecha. El ranking se ejecuta en el navegador contra el perfil local.

| Capa | Responsabilidad | Dependencia |
| --- | --- | --- |
| Interfaz estática | Perfil, criterios, resultados, comparación y seguimiento local. | Navegador del usuario. |
| Worker de búsqueda | Consulta autorizada, normalización, límite de resultados y deduplicación de la respuesta. | Cloudflare Workers, con nivel gratuito de inicio. |
| Fuentes públicas | Arbeitnow, Jobicy y, opcionalmente, Adzuna. | API de cada proveedor. |
| Persistencia privada | Perfil, lista guardada, estados e historial de URLs consultadas. | `localStorage` del navegador. |

La primera versión se desplegará sin credenciales y buscará en fuentes públicas compatibles. Cuando se añada la clave gratuita de Adzuna, el mismo Worker extenderá la cobertura española sin modificar el código ni exponer la clave.
