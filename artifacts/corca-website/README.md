# CORCA — entrega al cliente

## Stack
Diez páginas de **HTML estático**, CSS y JavaScript estándar. Los carruseles y el menú no dependen de frameworks. Un servidor pequeño, hecho con los módulos nativos de **Node.js**, sirve los archivos y aplica las redirecciones.

**Sin React, Babel, Vite, Express, API separado, base de datos ni dependencias de npm.** El contenido y ambas traducciones están en HTML y se pueden leer aunque JavaScript esté desactivado.

## Instalación y arranque
1. Copiar esta carpeta al hosting. Para una entrega mínima, bastan `site/`, `server.mjs` y `routes.mjs`. También conviene entregar este README y `scripts/`.
2. Utilizar **Node.js 22 o 24 LTS**. No hace falta ejecutar `npm install`, pnpm ni una compilación.
3. Desde esta carpeta:
   ```sh
   node server.mjs
   ```
   Por defecto escucha en el puerto 3000. Si el hosting asigna otro puerto:
   ```sh
   PORT=8080 node server.mjs
   ```
   En paneles que administran variables, configurar `PORT` allí. El archivo de inicio es `server.mjs`.
4. El hosting debe mantener el proceso activo, dirigir el dominio hacia ese puerto y gestionar HTTPS con su proxy/certificado.

Las páginas se sirven inmediatamente desde `site/`. Una edición de HTML/CSS/JS no requiere recompilar; los cambios en el servidor o sus rutas sí requieren reiniciar Node.js.

## Archivos editables
| Página | Español | Inglés |
|---|---|---|
| Inicio | `site/index.html` | `site/en/index.html` |
| Quiénes somos | `site/quienes-somos/index.html` | `site/en/about-us/index.html` |
| Manufactura | `site/manufactura/index.html` | `site/en/manufacturing/index.html` |
| Distribución | `site/distribucion/index.html` | `site/en/distribution/index.html` |
| Contacto | `site/contacto/index.html` | `site/en/contact/index.html` |

- Fotos, logos y estilos: `site/assets/`.
- Estilos específicos de cada tipo de página: `site/assets/pages/`.
- Responsive: `site/assets/responsive.css`.
- Interacciones: `site/assets/site.js`; estilos complementarios: `site/assets/site.css`.
- Rutas y redirecciones: `routes.mjs`.
- SEO: metadatos en cada HTML; `site/robots.txt` y `site/sitemap.xml`.

Mantener ambas versiones al editar textos, descripciones de imágenes y metadatos. No hay un diccionario o runtime que traduzca la página al cargar. Los nombres históricos `.dc.html` solo sobreviven como redirecciones.

## Dominio y SEO
El dominio canónico se mantiene como estaba durante el desarrollo. **Antes de instalar en el dominio definitivo**, ejecutar:
```sh
node scripts/set-domain.mjs https://DOMINIO-REAL-DEL-CLIENTE
node scripts/check-static.mjs
```
Esto cambia de forma coherente canonical, hreflang, URLs de Open Graph/Twitter, robots y sitemap en los diez HTML. No ejecutar el ejemplo literalmente: utilizar el dominio confirmado por el cliente.

El servidor mantiene las URLs limpias, redirecciones 301 de los antiguos nombres con espacios y de barras finales, 404 reales, compresión gzip, ETag y caché. No redirige rutas desconocidas al inicio.

Alternativa sin Node.js: se puede servir únicamente `site/` como sitio estático, siempre que el proveedor configure las rutas limpias y las mismas redirecciones de `routes.mjs`. Una redirección universal a `index.html` no es adecuada.

## Formulario de contacto: pendiente de configurar
Los campos, motivos y validación están preparados, pero **no se envía ni almacena ningún mensaje**. La página informa esta situación y ofrece los datos de contacto existentes. No se muestra una confirmación falsa de recepción.

Para habilitarlo después, el proveedor —que también gestiona el correo del cliente— deberá confirmar:
- Host y puerto de su SMTP o relay interno, y si usa TLS.
- Autenticación requerida o autorización por IP/origen del servidor.
- Remitente autorizado, correo receptor, límites y reglas de envío.
- Que el proceso Node.js puede conectarse a ese servicio desde el hosting final.

La implementación futura deberá validar en el servidor, limitar abusos, usar los datos del visitante como `Reply-To` (no como remitente), evitar inyección de cabeceras y confirmar el envío solo después de que el servicio de correo lo acepte. Los secretos van en las variables protegidas del hosting, nunca en HTML ni en archivos del cliente. No se necesita contratar un proveedor adicional.

## Verificación
```sh
node scripts/check-static.mjs
```
Comprueba estructura, idiomas, contenido estático, rutas, recursos y SEO. No genera ni modifica las páginas.

El Canvas de Replit es una herramienta de diseño separada. Su código, dependencias y archivos no son parte de la web del cliente y no deben copiarse al hosting.
