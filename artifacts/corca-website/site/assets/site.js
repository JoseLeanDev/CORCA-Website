// No rendering, template fetching or translation runtime: the HTML is the site.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const behavior = () => reducedMotion.matches ? 'instant' : 'smooth';

function setupCarousel(container, viewport, track, dotsContainer) {
  const slides = [...track.children];
  const previous = container.querySelector('[data-carousel-direction="-1"]');
  const next = container.querySelector('[data-carousel-direction="1"]');
  let position = 0;
  let maximum = 0;
  let step = 1;
  let dots = [];
  let frame;

  function go(index) {
    position = Math.max(0, Math.min(maximum, index));
    viewport.scrollTo({ left: Math.min(position * step, viewport.scrollWidth - viewport.clientWidth), behavior: behavior() });
  }
  function update() {
    position = Math.max(0, Math.min(maximum, Math.round(viewport.scrollLeft / step)));
    if (previous) previous.disabled = viewport.scrollLeft < 2;
    if (next) next.disabled = viewport.scrollLeft >= viewport.scrollWidth - viewport.clientWidth - 2;
    dots.forEach((dot, i) => {
      if (i === position) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  }
  function measure() {
    if (!slides.length) return;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    step = slides[0].getBoundingClientRect().width + gap;
    // Based on the actual viewport/card measurements, not assumed page padding.
    maximum = Math.max(0, Math.ceil((viewport.scrollWidth - viewport.clientWidth - 1) / step));
    if (dotsContainer && dots.length !== maximum + 1) {
      dotsContainer.replaceChildren();
      dots = Array.from({ length: maximum + 1 }, (_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', document.documentElement.lang === 'en' ? `Show product ${i + 1}` : `Mostrar producto ${i + 1}`);
        dot.setAttribute('aria-controls', viewport.id);
        dot.addEventListener('click', () => go(i));
        dotsContainer.append(dot);
        return dot;
      });
    }
    position = Math.min(position, maximum);
    viewport.scrollTo({ left: Math.min(position * step, viewport.scrollWidth - viewport.clientWidth), behavior: 'instant' });
    update();
  }
  previous?.addEventListener('click', () => go(position - 1));
  next?.addEventListener('click', () => go(position + 1));
  viewport.addEventListener('scroll', () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(update);
  }, { passive: true });
  viewport.addEventListener('keydown', event => {
    if (event.target !== viewport) return;
    const target = { ArrowLeft: position - 1, ArrowRight: position + 1, Home: 0, End: maximum }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    go(target);
  });
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(viewport);
  else window.addEventListener('resize', measure, { passive: true });
  measure();
}

const products = document.getElementById('productos');
if (products) {
  setupCarousel(products, products.querySelector('.cw-carousel-outer'), products.querySelector('.cw-carousel-track'), products.querySelector('.cw-carousel-dots'));
}
document.querySelectorAll('.cw-brand-carousel').forEach(carousel => {
  setupCarousel(carousel, carousel.querySelector('.cw-brand-carousel-viewport'), carousel.querySelector('.cw-brand-carousel-track'));
});

const menu = document.getElementById('cw-nav-check');
const navigation = document.getElementById('site-navigation');
if (menu && navigation) {
  const label = document.querySelector('.cw-menu-toggle');
  const sync = () => label.setAttribute('aria-expanded', String(menu.checked));
  menu.addEventListener('change', sync);
  navigation.addEventListener('click', event => {
    if (event.target.closest('a')) { menu.checked = false; sync(); }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.checked) { menu.checked = false; sync(); menu.focus(); }
  });
  document.addEventListener('click', event => {
    if (menu.checked && !event.target.closest('header') && event.target !== menu) { menu.checked = false; sync(); }
  });
  sync();
}

const form = document.getElementById('contact-form');
if (form) {
  const submit = form.querySelector('[type="submit"]');
  const status = document.getElementById('contact-status');
  // This only validates the form; no message is sent or stored.
  submit.disabled = false;
  form.addEventListener('submit', event => {
    event.preventDefault();
    status.textContent = document.documentElement.lang === 'en'
      ? 'Your message has not been sent. Message delivery is not configured yet; please contact us directly by phone or email.'
      : 'Su mensaje no ha sido enviado. El envío aún no está configurado; contáctenos directamente por teléfono o correo.';
    status.tabIndex = -1;
    status.focus();
  });
}
document.documentElement.classList.add('interactive');
