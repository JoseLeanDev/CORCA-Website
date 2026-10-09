// Static HTML stays visible if JavaScript or its dependencies are slow/unavailable.
// Load the editable DC component only to activate its existing interactions.
(async () => {
  const script = document.currentScript;
  const fallback = document.getElementById('corca-static');
  if (!script || !fallback) return;
  try {
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
    const observer = new MutationObserver(() => {
      const live = document.querySelector('body > #dc-root > .sc-host');
      if (!live?.querySelector('header') || live.textContent.includes('{{')) return;
      // Runtime may still be doing its first commit; switch before the next paint.
      requestAnimationFrame(() => {
        fallback.remove();
        document.body.classList.remove('corca-booting');
        observer.disconnect();
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const runtime = document.createElement('script');
    runtime.src = '/support.js';
    runtime.onerror = () => { observer.disconnect(); console.error('Interactive runtime unavailable; static content retained.'); };
    document.head.appendChild(runtime);
    // Failure never removes the readable static page.
    setTimeout(() => observer.disconnect(), 30000);
  } catch (error) {
    console.error('Interactive features unavailable; static content retained.', error);
  }
})();
