---
name: Hosting y correo de CORCA
description: El proveedor del cliente admite Node.js y gestiona el correo; no utilizar proveedores adicionales de email.
---
El proveedor de hosting es el mismo que maneja los correos del cliente. El usuario confirmó que el proveedor tiene varias páginas gestionadas con Node.js. El formulario debe usar un servicio interno de ese proveedor, sin proveedores externos adicionales de correo.

**Why:** El usuario indicó estas condiciones para la entrega al cliente.

**How to apply:** No introducir Express, un API separado o un proveedor transaccional de correo como requisito de esta web estática. Cuando se solicite implementar el envío, confirmar con el proveedor su SMTP/relay, autorización y conectividad; guardar credenciales únicamente como secretos del entorno y probar en el hosting final.
