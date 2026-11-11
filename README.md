# Sitio web de CORCA

Guía para entregar e instalar el sitio en el hosting del cliente.

## Tecnología y requisitos

- Sitio bilingüe en HTML, CSS y JavaScript estándar.
- Servidor mínimo escrito con módulos incluidos en Node.js.
- Node.js **22 LTS o posterior**.
- No requiere React, Vite, Express, base de datos ni paquetes externos.
- No requiere `npm install` ni un paso de compilación.

El servidor Node.js sirve los archivos estáticos, mantiene las rutas limpias y aplica las redirecciones históricas. El contenido principal está escrito en HTML, por lo que las páginas siguen siendo legibles aunque JavaScript esté desactivado.

## Preparar los archivos para producción

Desde la raíz de este repositorio, entra al paquete del sitio y configura el dominio definitivo antes de subirlo:

```sh
cd artifacts/corca-website
node scripts/set-domain.mjs https://www.dominio-del-cliente.com
node scripts/check-static.mjs
```

Reemplaza el dominio de ejemplo por el dominio HTTPS confirmado por el cliente. El primer comando actualiza las URL canónicas, las etiquetas de idioma, los metadatos para compartir, `robots.txt` y `sitemap.xml`. El segundo valida las diez páginas y sus recursos.

Entrega estos archivos y carpetas al hosting:

```text
server.mjs
routes.mjs
package.json
site/
scripts/
README.md
```

El contenido del sitio y sus imágenes están dentro de `site/`. `scripts/` contiene las herramientas para configurar el dominio y validar la entrega. Incluye este README en la carpeta que recibirá el cliente.

## Instalar y arrancar

1. Crea en el hosting una aplicación o servicio Node.js con Node.js 22 LTS o posterior.
2. Sube los archivos anteriores y abre una terminal en esa carpeta.
3. Inicia el servidor:

   ```sh
   npm start
   ```

   También se puede iniciar directamente con `node server.mjs`.

No ejecutes `npm install`: el servidor utiliza únicamente módulos incluidos en Node.js. El servicio escucha en `0.0.0.0` y usa el puerto de la variable `PORT`; si el hosting no la define, usa el puerto `3000`. Configura el puerto asignado por el proveedor en el panel del servicio y mantén el proceso Node.js activo.

El proveedor debe apuntar el dominio al servicio y gestionar HTTPS mediante su proxy o certificado. No hace falta compilar el sitio.

## Páginas y rutas

| Español | Inglés |
|---|---|
| `/` | `/en` |
| `/quienes-somos` | `/en/about-us` |
| `/manufactura` | `/en/manufacturing` |
| `/distribucion` | `/en/distribution` |
| `/contacto` | `/en/contact` |

`routes.mjs` conserva estas rutas y las redirecciones 301 de direcciones antiguas. No configures una regla que envíe todas las rutas desconocidas a la página de inicio: el servidor debe devolver un 404 real.

## Formulario de contacto

El formulario todavía **no envía ni almacena mensajes**. La página lo indica al visitante; no debe presentarse como un formulario operativo hasta completar esta integración.

Para habilitar las notificaciones por correo en el hosting del cliente, el proveedor debe confirmar:

- Host y puerto de su SMTP o relay interno y si requiere TLS.
- Si requiere autenticación o autorización por IP/origen.
- Dirección remitente autorizada y correo receptor.
- Límites de envío y disponibilidad de conexión saliente desde el servicio Node.js.

La integración y sus pruebas se deben realizar cuando el proveedor confirme esos datos. No se requiere un servicio de correo externo. Las credenciales, si fueran necesarias, deben configurarse como variables protegidas en el hosting; nunca se deben guardar en el HTML o en el repositorio.

## Verificación

Desde la carpeta del sitio, ejecuta:

```sh
node scripts/check-static.mjs
```

Después de iniciar el servicio, comprueba la página principal, las rutas de ambos idiomas, el cambio de idioma, el dominio HTTPS y las redirecciones antiguas.
