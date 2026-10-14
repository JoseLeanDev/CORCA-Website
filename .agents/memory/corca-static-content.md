---
name: CORCA content availability and SEO
description: Plain static HTML, preserved design and SEO, and bilingual content constraints.
---
El sitio debe ser estático, con HTML editable, CSS y JavaScript sencillo. El usuario pidió eliminar React, Vite, Express y el API innecesario, manteniendo la página como está y las reglas de SEO y optimización. Esto sustituye la decisión anterior de conservar las plantillas DC como fuente obligatoria.

**Why:** El usuario quiere simplificar la entrega al cliente, sin frameworks innecesarios para una web estática. El contenido debe seguir disponible sin JavaScript, incluso para buscadores y en celulares lentos.

**How to apply:** Conservar contenido, diseño, idiomas y carruseles al sustituir el sistema antiguo; servir HTML completo directamente. Mantener rutas y redirecciones iguales en vista previa y producción, sin un rewrite global al inicio; un servidor mínimo de Node.js puede conservar las redirecciones sin Express.

The entire corporate site must be available in Spanish and English. Use natural business English while preserving brand names, dates, quantities and contact information.

**Why:** The user said the client gave freedom over the translation and requested an English switch for all website text.

**How to apply:** Keep both languages complete when updating copy, including forms, interaction states, image descriptions and sharing metadata. Language switching should open the corresponding page, and English navigation must stay in English. Both languages must remain readable without JavaScript.
