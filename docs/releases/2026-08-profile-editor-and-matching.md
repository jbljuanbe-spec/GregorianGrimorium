# Mejora del editor de perfil y del matching semántico

## Alcance

Esta versión mejora el flujo de edición del perfil privado y el modo en que Byscador ordena las ofertas. El editor se presenta como un diálogo desplazable, puede cerrarse mediante el botón, el fondo o la tecla `Escape`, y conserva el foco de teclado. La interfaz incorpora transiciones breves y desactiva el movimiento no esencial cuando el navegador comunica una preferencia de reducción de movimiento.

El ranking deja de valorar por una simple presencia de palabras. Ahora diferencia una coincidencia en el título de una mención secundaria en la descripción y pondera, de manera explicable, el rol, las competencias del perfil, la intención de búsqueda, los idiomas, la experiencia solicitada, la ubicación y la pertenencia a una empresa objetivo.

## Garantías

El CV, el perfil y el historial continúan siendo locales al navegador. La ampliación de términos para las búsquedas de Adzuna está limitada a un máximo de dos variantes relacionadas, de modo que no se convierte en una exploración indiscriminada. La deduplicación se conserva por URL canónica o identificador de requisición cuando existe; por ello no se ocultan posiciones diferentes de la misma empresa.

## Validación

La rama incorpora cobertura de pruebas para el diálogo de perfil, el matching de sinónimos, la prioridad de coincidencias en el título y el límite de variantes de consulta. También se han ejecutado las pruebas autónomas, TypeScript, Vitest y una comprobación seca del Worker.
