// Clean public URLs and their editable HTML files. No frontend router is used.
export const routes = {
  '/': 'index.html',
  '/quienes-somos': 'quienes-somos/index.html',
  '/manufactura': 'manufactura/index.html',
  '/distribucion': 'distribucion/index.html',
  '/contacto': 'contacto/index.html',
  '/en': 'en/index.html',
  '/en/about-us': 'en/about-us/index.html',
  '/en/manufacturing': 'en/manufacturing/index.html',
  '/en/distribution': 'en/distribution/index.html',
  '/en/contact': 'en/contact/index.html',
};
export const redirects = {
  '/Homepage Corca.dc.html': '/',
  '/Homepage Corca v2.dc.html': '/',
  '/index.html': '/',
  '/Quienes Somos Corca.dc.html': '/quienes-somos',
  '/Manufactura Corca.dc.html': '/manufactura',
  '/Distribucion Corca.dc.html': '/distribucion',
  '/Contacto Corca.dc.html': '/contacto',
  ...Object.fromEntries(Object.entries(routes).filter(([route]) => route !== '/').map(([route, file]) => [`/${file}`, route])),
};
