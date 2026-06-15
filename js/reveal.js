/**
 * Studio Bear — Photography
 * js/reveal.js
 *
 * Scroll-reveal: adds .sb-visible to [data-sb-reveal] elements
 * as they enter the viewport, staggered by sibling index.
 */

(function () {
  const items = document.querySelectorAll('[data-sb-reveal]');

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
})();
