// Shared route and metadata definitions for generation, serving and tests.
export const productionOrigin = 'https://corca-website.replit.app';
export const pages = [
  {
    route: '/', source: 'index.html',
    enRoute: '/en',
    enTitle: 'CORCA | Manufacturing and Distribution in Guatemala',
    enDescription: 'CORCA brings together Chao Mein manufacturing, consumer goods distribution and brand development in Guatemala, Central America and the United States.',
    aliases: ['Homepage Corca.dc.html', 'Homepage Corca v2.dc.html', 'index.html'],
    title: 'CORCA | Manufactura y distribución en Guatemala',
    description: 'CORCA integra manufactura de Chao Mein, distribución de productos de consumo masivo y desarrollo de marcas en Guatemala, Centroamérica y Estados Unidos.',
  },
  {
    route: '/quienes-somos', source: 'Quienes Somos Corca.dc.html',
    enRoute: '/en/about-us',
    enTitle: 'About Us | CORCA’s History and Values',
    enDescription: 'Discover CORCA’s journey since 2014: distribution, industrial capacity, strategic partnerships and expansion in Guatemala and international markets.',
    title: 'Quiénes somos | Historia y valores de CORCA',
    description: 'Conozca la trayectoria de CORCA desde 2014: distribución, capacidad industrial, alianzas estratégicas y expansión en Guatemala y mercados internacionales.',
  },
  {
    route: '/manufactura', source: 'Manufactura Corca.dc.html',
    enRoute: '/en/manufacturing',
    enTitle: 'Chao Mein and Contract Manufacturing | CORCA',
    enDescription: 'We manufacture Chao Mein noodles, our own brands and products for third parties. Explore our production process, pack sizes and international markets.',
    title: 'Manufactura de Chao Mein y maquila | CORCA',
    description: 'Fabricamos fideos tipo Chao Mein, marcas propias y productos para terceros. Conozca nuestro proceso, presentaciones y presencia en mercados internacionales.',
  },
  {
    route: '/distribucion', source: 'Distribucion Corca.dc.html',
    enRoute: '/en/distribution',
    enTitle: 'Consumer Goods Distribution in Guatemala | CORCA',
    enDescription: 'We distribute Olimpia, Tronix, ¡YaEstá!, Sabrocronchi’s, Mundi Globales and Padova through a logistics network serving 14 departments across Guatemala.',
    title: 'Distribución de consumo masivo en Guatemala | CORCA',
    description: 'Distribuimos Olimpia, Tronix, ¡YaEstá!, Sabrocronchi’s, Mundi Globales y Padova con una red logística que atiende comercios en 14 departamentos de Guatemala.',
  },
  {
    route: '/contacto', source: 'Contacto Corca.dc.html',
    enRoute: '/en/contact',
    enTitle: 'Contact | CORCA Manufacturing and Distribution',
    enDescription: 'Contact CORCA for our product portfolio, distribution and contract manufacturing. Reach our team by phone, business WhatsApp or email.',
    title: 'Contacto | Manufactura y distribución CORCA',
    description: 'Contacte a CORCA para conocer nuestro portafolio, distribución, manufactura y maquila. Teléfono, WhatsApp comercial y correo para atender su solicitud.',
  },
];
export const localizedPages = pages.flatMap(page => [
  { ...page, locale: 'es', esRoute: page.route },
  { ...page, locale: 'en', esRoute: page.route, route: page.enRoute, title: page.enTitle, description: page.enDescription },
]);
export const englishRoutes = Object.fromEntries(pages.map(page => [page.route, page.enRoute]));
export const legacyRoutes = Object.fromEntries(
  pages.flatMap(page => [...new Set([page.source, ...(page.aliases || [])])]
    .map(name => [`/${name}`, page.route])),
);
