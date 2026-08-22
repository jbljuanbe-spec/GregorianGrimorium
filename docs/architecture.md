# Decisiones de producto — Byscador de Ofertas España

## Alcance inicial

La plataforma es un espacio personal protegido por inicio de sesión. Conserva el perfil profesional, las preferencias y el seguimiento de candidaturas exclusivamente en la cuenta del usuario. Las ofertas se gestionan como registros privados con su URL original de candidatura; la aplicación no automatiza postulaciones ni almacena credenciales de portales externos.

## Fuentes de descubrimiento

El producto tendrá enlaces de consulta rápidos para los principales portales generalistas y redes profesionales: InfoJobs, LinkedIn Empleos, Indeed España y Empléate. Empléate es el agregador público estatal que reúne ofertas de portales colaboradores; se prioriza también como punto de partida para posiciones institucionales. Cada ficha mantiene el enlace de origen para que el usuario verifique vigencia y condiciones antes de solicitar.

Además, la interfaz reserva una categoría de fuente para portales de carrera corporativos y organismos objetivos. Esta permite registrar la página de empleo original de empresas como ICEX, CDTI, Iberdrola, Indra, Airbus, GMV, Sener, Amadeus o las cámaras empresariales, sin afirmar que se ha extraído una oferta si no existe un dato verificable.

## Adecuación explicable

La puntuación se calcula sobre 100 y se desglosa en competencias y palabras clave (45 puntos), enfoque profesional y sector (25), ubicación y modalidad (15), idiomas y nivel requerido (10), y condiciones preferidas (5). Los requisitos excluyentes no cumplidos aplican una penalización transparente. El resultado muestra siempre coincidencias y carencias; nunca recomienda incorporar una habilidad que no conste en el perfil.

## Perfil de partida

El perfil inicial consolida experiencia en desarrollo de negocio internacional, comercio exterior, relaciones institucionales, análisis financiero y programas aeroespaciales. Sus prioridades son Madrid como base, puestos de comercio exterior, desarrollo de negocio internacional, relaciones institucionales, defensa y aeroespacial, y funciones de análisis o gestión de proyectos. Entre los idiomas se configuran español nativo, inglés C1 e italiano C1.

## Referencias de fuentes

1. [Empléate — Portal estatal de ofertas de empleo](https://www.empleate.gob.es/empleo/#/)
2. [InfoJobs — Bolsa de trabajo y ofertas de empleo](https://www.infojobs.net/)
3. [LinkedIn Empleos](https://es.linkedin.com/jobs)
4. [Indeed España](https://es.indeed.com/)

## Validación realizada

La experiencia se ha revisado en escritorio y en una vista móvil de 375 px para el resumen, catálogo, comparador y perfil. Las vistas gestionan carga, ausencia de datos y errores recuperables mediante mensajes y acciones de reintento. La capa de datos emplea procedimientos protegidos: las pruebas verifican que un usuario sin sesión no puede consultar ni el perfil profesional ni las ofertas privadas.

La validación automatizada cubre la puntuación de adecuación, la detección de coincidencias y carencias, los filtros por texto, ubicación, modalidad, contrato, área, fecha y estado, los cuatro estados de candidatura y el control de acceso. La batería actual contiene 17 pruebas unitarias.
