/**
 * Studio Bear — Photography
 * js/reveal.js
 *
 * Scroll-reveal: adds .sb-visible to [data-sb-reveal] elements
 * as they enter the viewport, with GSAP ScrollTrigger batching & stagger.
 */

(function () {
  const items = document.querySelectorAll('[data-sb-reveal]');
  if (!items.length) return;

  if (window.gsap && window.ScrollTrigger) {
    window.gsap.registerPlugin(window.ScrollTrigger);

    window.ScrollTrigger.batch(items, {
      interval: 0.08,
      batchMax: 4,
      start: 'top 88%',
      once: true,
      onEnter: (batch) => {
        batch.forEach((el, i) => {
          setTimeout(() => el.classList.add('sb-visible'), i * 110);
        });
      }
    });
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const siblings = [...entry.target.parentElement.children];
          const idx      = siblings.indexOf(entry.target);
          setTimeout(() => entry.target.classList.add('sb-visible'), idx * 120);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    items.forEach(el => io.observe(el));
  }
})();
