---
name: Verificación del navegador sin JavaScript
description: Evitar esperas bloqueadas al probar la web con JavaScript desactivado.
---
En pruebas con JavaScript desactivado, usar lecturas síncronas del DOM y esperas controladas por el runner, no promesas que dependan de callbacks programados dentro de la página.

**Why:** Una comprobación con requestAnimationFrame dentro de page.evaluate quedó esperando hasta el timeout; las lecturas síncronas y una espera del runner sí permitieron comprobar la visibilidad.

**How to apply:** Para comprobar contenido y CSS sin JavaScript, esperar la carga de estilos desde el runner y consultar getComputedStyle o las propiedades del DOM directamente. No interpretar un callback de evaluación bloqueado como un fallo de la web.
