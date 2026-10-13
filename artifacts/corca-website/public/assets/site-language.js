// Shared by the static-page generator and interactive runtime.
export function localizeHost(host, config) {
  const { locale, esRoute, enRoute, routes, dictionary = {} } = config;
  const normalize = text => text.replace(/\s+/g, ' ').trim();
  const translate = text => {
    const key = normalize(text);
    return Object.hasOwn(dictionary, key) ? dictionary[key] : key;
  };
  if (locale === 'en') {
    const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement.closest('script,style,svg,template,.cw-language-switch')) continue;
      const original = node.data;
      const translated = translate(original);
      if (translated !== normalize(original)) {
        node.data = original.replace(/\S[\s\S]*\S|\S/, translated);
      }
    }
    for (const element of host.querySelectorAll('[alt],[title],[placeholder],[aria-label],[aria-roledescription]')) {
      if (element.closest('.cw-language-switch')) continue;
      for (const attribute of ['alt', 'title', 'placeholder', 'aria-label', 'aria-roledescription']) {
        const value = element.getAttribute(attribute);
        if (value) element.setAttribute(attribute, translate(value));
      }
    }
    for (const anchor of host.querySelectorAll('a[href]')) {
      if (anchor.closest('.cw-language-switch')) continue;
      const href = anchor.getAttribute('href');
      const url = new URL(href, location.origin);
      if (url.origin === location.origin && routes[url.pathname]) {
        anchor.setAttribute('href', routes[url.pathname] + url.search + url.hash);
      }
    }
  }
  const header = host.querySelector('.cw-header');
  const menu = header?.querySelector('.cw-menu-toggle');
  if (menu) menu.setAttribute('aria-label', locale === 'en' ? 'Open menu' : 'Abrir menú');
  const navigation = header?.querySelector('.cw-nav');
  const contactButton = header?.querySelector('.cw-cta-btn');
  if (navigation && contactButton) {
    for (const link of navigation.querySelectorAll('a')) {
      if (['Contacto', 'Contact'].includes(link.textContent.trim())) link.remove();
    }
    // The desktop CTA is hidden on phones; keep one contact action in the drawer.
    if (!navigation.querySelector('.cw-contact-mobile')) {
      const mobileContact = contactButton.cloneNode(true);
      mobileContact.className = 'cw-contact-mobile';
      navigation.appendChild(mobileContact);
    }
  }
  if (header && !header.querySelector('.cw-language-switch')) {
    const selector = document.createElement('div');
    selector.className = 'cw-language-switch';
    selector.setAttribute('role', 'group');
    selector.setAttribute('aria-label', locale === 'en' ? 'Website language' : 'Idioma del sitio');
    for (const [lang, href, label, title] of [
      ['es', esRoute, 'ES', 'Español'], ['en', enRoute, 'EN', 'English'],
    ]) {
      const link = document.createElement('a');
      link.href = href;
      link.hreflang = lang;
      link.lang = lang;
      link.textContent = label;
      link.title = title;
      link.setAttribute('aria-label', title);
      if (lang === locale) link.setAttribute('aria-current', 'true');
      selector.appendChild(link);
    }
    header.appendChild(selector);
  }
}
