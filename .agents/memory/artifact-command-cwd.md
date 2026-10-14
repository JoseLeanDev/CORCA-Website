---
name: Directorio de ejecución de los servicios
description: Evitar rutas duplicadas al configurar comandos Node.js en artefactos.
---
Los comandos de un servicio administrado se ejecutan desde el directorio del artefacto. Las rutas de los manifiestos deben ser relativas a ese directorio; no repetir el prefijo de la raíz del workspace.

**Why:** Un comando válido desde la raíz falló en el servicio con MODULE_NOT_FOUND porque el directorio del artefacto se antepuso de nuevo.

**How to apply:** Al cambiar comandos de desarrollo o producción, distinguir los comandos del manifiesto de los que se ejecutan manualmente desde la raíz. Si falla una ruta existente, comprobar el directorio efectivo en el error antes de crear un segundo servidor o cambiar de stack.
