# CORCA

Sitio corporativo estático bilingüe de Corporación Caraliant, S.A.: manufactura, distribución y marcas de consumo masivo.

## Arquitectura y alcance
- La web del cliente es HTML, CSS y JavaScript estándar, sin React, Babel, Vite, Express, API o base de datos.
- `artifacts/corca-website/site/` contiene las diez páginas HTML editables y sus recursos definitivos. No hay generación, hidratación ni runtime de traducción.
- `artifacts/corca-website/server.mjs` utiliza únicamente módulos nativos de Node.js para servir archivos, aplicar redirecciones y devolver 404 reales.
- El API inicial era scaffolding de ejemplo: su servicio fue retirado y no debe reintroducirse.
- `artifacts/mockup-sandbox/` es el Canvas de diseño separado, no parte de la entrega ni del despliegue de CORCA. Su tooling React/Vite pertenece únicamente a esa herramienta.

## Operación
- Vista previa y producción: `node artifacts/corca-website/server.mjs`, con `PORT` suministrado por el servicio. Fuera de Replit el puerto por defecto es 3000.
- Verificación rápida: `node artifacts/corca-website/scripts/check-static.mjs`.
- Pruebas de navegador del workspace: `pnpm test:browser`; usan Chromium del sistema y Playwright como herramienta de prueba, nunca como dependencia del sitio.
- Instrucciones de entrega: `artifacts/corca-website/README.md`.
- No requiere instalar paquetes ni compilar para arrancar la web. El comando de build solo valida los archivos existentes.

## Contenido y SEO
- Mantener ambos idiomas completos en HTML; al cambiar textos, actualizar también inglés, alt y metadatos.
- Rutas: `/`, `/quienes-somos`, `/manufactura`, `/distribucion`, `/contacto`; equivalentes inglesas en `/en`.
- Conservar canonical, hreflang, Open Graph/Twitter, robots/sitemap y las redirecciones históricas de `routes.mjs`.
- No convertir todas las rutas en un rewrite al inicio ni volver a introducir marcadores sin resolver.
- Mantener diseño aprobado, carouseles, seis marcas y todas las imágenes de productos.

## Contacto
El formulario no envía ni almacena mensajes todavía; no simular recepción. El hosting del cliente admite Node.js y también maneja su correo. Cuando se pida implementar el envío, utilizar su SMTP/relay interno, sin un proveedor externo adicional y sin credenciales en los archivos.
