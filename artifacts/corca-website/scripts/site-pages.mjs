// Shared route and metadata definitions for generation, serving and tests.
export const productionOrigin = 'https://corca-website.replit.app';
export const pages = [
  {
    route: '/', source: 'index.html',
    aliases: ['Homepage Corca.dc.html', 'Homepage Corca v2.dc.html', 'index.html'],
    title: 'CORCA | Manufactura y distribución en Guatemala',
    description: 'CORCA integra manufactura de Chao Mein, distribución de productos de consumo masivo y desarrollo de marcas en Guatemala, Centroamérica y Estados Unidos.',
  },
  {
    route: '/quienes-somos', source: 'Quienes Somos Corca.dc.html',
    title: 'Quiénes somos | Historia y valores de CORCA',
    description: 'Conozca la trayectoria de CORCA desde 2014: distribución, capacidad industrial, alianzas estratégicas y expansión en Guatemala y mercados internacionales.',
  },
  {
    route: '/manufactura', source: 'Manufactura Corca.dc.html',
    title: 'Manufactura de Chao Mein y maquila | CORCA',
    description: 'Fabricamos fideos tipo Chao Mein, marcas propias y productos para terceros. Conozca nuestro proceso, presentaciones y presencia en mercados internacionales.',
  },
  {
    route: '/distribucion', source: 'Distribucion Corca.dc.html',
    title: 'Distribución de consumo masivo en Guatemala | CORCA',
    description: 'Distribuimos Olimpia, Tronix, ¡YaEstá!, Sabrocronchi’s, Mundi Globales y Padova con una red logística que atiende comercios en 14 departamentos de Guatemala.',
  },
  {
    route: '/contacto', source: 'Contacto Corca.dc.html',
    title: 'Contacto | Manufactura y distribución CORCA',
    description: 'Contacte a CORCA para conocer nuestro portafolio, distribución, manufactura y maquila. Teléfono, WhatsApp comercial y correo para atender su solicitud.',
  },
];
export const legacyRoutes = Object.fromEntries(
  pages.flatMap(page => [...new Set([page.source, ...(page.aliases || [])])]
    .map(name => [`/${name}`, page.route])),
);
