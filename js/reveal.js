/**
 * Estudio El Oso — Photography
 * js/reveal.js
 *
 * High-performance Scroll-Reveal & Mobile Navigation
 * Built with GSAP ScrollTrigger & Passive Interaction Listeners
 */

(function () {
  'use strict';

  // ── Scroll Reveal System ──
  const items = document.querySelectorAll('[data-sb-reveal]');
  
  if (items.length && window.gsap && window.ScrollTrigger) {
    window.gsap.registerPlugin(window.ScrollTrigger);

    items.forEach((el) => {
      window.gsap.from(el, {
        scrollTrigger: {
          trigger: el,
          start: 'top 92%',
          once: true
        },
        opacity: 0,
        y: 20,
        duration: 0.75,
        ease: 'power3.out',
        clearProps: 'all'
      });
    });

    if (document.fonts) {
      document.fonts.ready.then(() => {
        window.ScrollTrigger.refresh();
      });
    }
  }

  // ── Scrolled Past Hero Surface Handler ──
  const siteHeader = document.getElementById('site-header');

  function updateScrollState() {
    const isPastHero = window.scrollY > (window.innerHeight * 0.7);
    if (siteHeader) siteHeader.classList.toggle('is-scrolled', isPastHero);
    document.body.classList.toggle('show-header-blur', isPastHero);
  }

  window.addEventListener('scroll', updateScrollState, { passive: true });
  updateScrollState();

  // ── Mobile Navigation Drawer ──
  const navToggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('nav');

  if (navToggle && nav) {
    function toggleNav(e) {
      if (e) e.preventDefault();
      const isOpen = nav.classList.toggle('is-open');
      navToggle.classList.toggle('is-active', isOpen);
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      document.body.classList.toggle('nav-drawer-open', isOpen);
    }

    navToggle.addEventListener('click', toggleNav);

    // Close when clicking any nav link
    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        if (nav.classList.contains('is-open')) {
          toggleNav();
        }
      });
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        toggleNav();
      }
    });
  }
})();
