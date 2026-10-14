---
name: Directorio de ejecución de los servicios
description: Distinguir el directorio efectivo de desarrollo y publicación al configurar comandos Node.js.
---
En este proyecto, el servicio administrado de desarrollo ejecuta su comando desde el directorio del artefacto, pero la publicación ejecuta los comandos de producción desde la raíz del workspace. No asumir que ambos usan el mismo directorio.

**Why:** En desarrollo, repetir el prefijo del artefacto produjo una ruta duplicada. En publicación, usar una ruta corta produjo MODULE_NOT_FOUND buscando el script en la raíz. Los registros confirmaron los dos directorios distintos.

**How to apply:** Mantener rutas relativas al artefacto en desarrollo y rutas desde la raíz en producción. Confirmar el directorio efectivo en los registros y probar tanto el comando de validación como el de arranque desde ese directorio antes de publicar. Si cambia la plataforma, confiar en los registros actuales.
