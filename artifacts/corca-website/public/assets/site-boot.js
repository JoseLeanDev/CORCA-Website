// Static HTML stays visible if JavaScript or its dependencies are slow/unavailable.
// Load the editable DC component only to activate its existing interactions.
(async () => {
  const script = document.currentScript;
  const fallback = document.getElementById('corca-static');
  if (!script || !fallback) return;
  try {
    const { localizeHost } = await import('/assets/site-language.js');
    const locale = script.dataset.locale || 'es';
    let dictionary = {};
    if (locale === 'en') {
      const dictionaryResponse = await fetch('/assets/translations-en.json');
      if (!dictionaryResponse.ok) throw new Error('English translations unavailable');
      dictionary = await dictionaryResponse.json();
    }
    const languageConfig = {
      locale, dictionary, routes: JSON.parse(script.dataset.routes || '{}'),
      esRoute: script.dataset.esRoute, enRoute: script.dataset.enRoute,
    };
    const response = await fetch(script.dataset.template);
    if (!response.ok) throw new Error(`Template: HTTP ${response.status}`);
    const source = new DOMParser().parseFromString(await response.text(), 'text/html');
    const template = source.querySelector('x-dc');
    const logic = source.querySelector('script[data-dc-script]');
    if (!template || !logic) throw new Error('Invalid component template');
    document.body.classList.add('corca-booting');
    // Avoid the DC runtime's redundant page fetch; local resource URLs remain valid.
    window.__resources = {};
    document.body.appendChild(document.importNode(template, true));
    document.body.appendChild(document.importNode(logic, true));
    let switched = false;
    const observe = () => observer.observe(document.body, {
      childList: true, subtree: true, characterData: true, attributes: true,
      attributeFilter: ['alt', 'title', 'placeholder', 'aria-label', 'aria-roledescription', 'href'],
    });
    const observer = new MutationObserver(() => {
      const live = document.querySelector('body > #dc-root > .sc-host');
      if (!live?.querySelector('header') || live.textContent.includes('{{')) return;
      observer.disconnect();
      localizeHost(live, languageConfig);
      document.title = script.dataset.title;
      observe();
      if (switched) return;
      switched = true;
      // Runtime may still be doing its first commit; switch before the next paint.
      requestAnimationFrame(() => {
        fallback.remove();
        document.body.classList.remove('corca-booting');
      });
    });
    observe();
    const runtime = document.createElement('script');
    runtime.src = '/support.js';
    runtime.onerror = () => { observer.disconnect(); console.error('Interactive runtime unavailable; static content retained.'); };
    document.head.appendChild(runtime);
    // Failure never removes the readable static page.
    setTimeout(() => { if (!switched) observer.disconnect(); }, 30000);
  } catch (error) {
    console.error('Interactive features unavailable; static content retained.', error);
  }
})();
